"""Голосовой ход наставника: поток модели → предложения → озвучка, всё одновременно.

Обычный чат (`ai_chat.send_message`) ждёт, пока модель допишет весь JSON, и только
потом отдаёт текст и заказывает озвучку целой реплики. В разговоре это слышно как
пауза в несколько секунд перед каждым ответом.

Здесь ход устроен иначе: токены модели идут потоком, как только набирается
законченное предложение — оно сразу уходит в синтез, а следующее пишется
параллельно. Первый звук появляется примерно через полсекунды, а не после
завершения всей реплики.

Разбор ошибок (corrections) считается отдельным запросом уже после того, как
наставник заговорил, и на скорость ответа не влияет.
"""
import asyncio
import json
import logging
import re
import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_ai_chat import ChatMessages, UserErrors
from app.services import ai_chat, llm_client, ratings, tts

logger = logging.getLogger(__name__)

# В разговоре важнее скорость, чем длина контекста: 20 сообщений истории — это заметная
# задержка до первого токена, а вслух всё равно обсуждают последние пару реплик.
VOICE_HISTORY_MESSAGES = 8
VOICE_MAX_TOKENS = 160
MAX_USER_TEXT = 1000

# Ниже этой длины кусок не считается отдельным предложением: иначе «Mr.», «i.e.» и
# просто «Ok.» разбивают реплику на обрывки, каждый со своим запросом в синтез.
MIN_SENTENCE_CHARS = 12
# Если модель пишет одно длинное предложение без точки, ждать её целиком незачем —
# режем по запятой, чтобы озвучка началась вовремя.
SOFT_BREAK_CHARS = 140

_SENTENCE_END = re.compile(r'[.!?…]+["\')\]]*\s')
_SOFT_BREAK = re.compile(r'[,;:—]\s')
_MARKDOWN = re.compile(r'[*_`~#>|]+')
_EMOJI = re.compile(
    '[\U0001F000-\U0001FAFF\U00002600-\U000027BF\U0000FE00-\U0000FE0F\U00002190-\U000021FF]+'
)
_MULTISPACE = re.compile(r'\s+')

VOICE_STYLE = (
    '\n\nSPEAKING OUT LOUD\n'
    '- This reply will be read aloud to the learner, not shown as text.\n'
    '- Answer in at most two short sentences, then ask one simple question.\n'
    '- Plain speech only: no markdown, no bullet points, no emoji, no headings,\n'
    '  no parentheses, no quotation marks around words.\n'
    '- Write numbers, dates and abbreviations the way they are spoken:\n'
    '  "1990" as "nineteen ninety", "Dr." as "Doctor", "%" as "percent".\n'
    '- Never mention corrections here. Someone else handles those.\n'
    '- Output the spoken words only. No JSON, no labels, no prefixes.'
)

CORRECTIONS_PROMPT = (
    'You are a {language} teacher reviewing one sentence a {level} learner just said out loud.\n'
    'Return JSON only: {{"corrections": [{{"what": "...", "better": "...", "why": "...", '
    '"severity": "blocks_meaning" | "sounds_unnatural" | "minor"}}]}}\n'
    'At most three items, and only what matters for being understood. Teach the rule in "why", '
    'never label the learner as wrong. If the sentence is fine, return an empty list.\n'
    'Explain "why" in {native_language}.\n\n'
    'LEARNER SAID: {text}'
)


def speakable(text: str):
    """Убрать из реплики всё, что синтезатор прочитает вслух как мусор."""
    cleaned = _MARKDOWN.sub('', text)
    cleaned = _EMOJI.sub(' ', cleaned)
    cleaned = _MULTISPACE.sub(' ', cleaned)
    return cleaned.strip()


def take_sentence(buffer: str):
    """Отрезать от буфера первое законченное предложение. Возвращает (предложение, остаток)."""
    match = _SENTENCE_END.search(buffer)
    if match and match.end() >= MIN_SENTENCE_CHARS:
        return buffer[:match.end()].strip(), buffer[match.end():]

    if len(buffer) >= SOFT_BREAK_CHARS:
        soft = _SOFT_BREAK.search(buffer, MIN_SENTENCE_CHARS)
        if soft:
            return buffer[:soft.end()].strip(), buffer[soft.end():]

    return None, buffer


def _voice_system_prompt(session, tutor: str):
    base = ai_chat._system_prompt(
        session.scenario, session.language, session.level, session.native_language, tutor=tutor
    )
    # Формат ответа из обычного чата — это JSON с corrections. Вслух он не нужен: обрезаем
    # его и подменяем правилами устной речи.
    without_format = base.split('\n\nRESPONSE FORMAT')[0].split('\n\nOUTPUT')[0]
    return without_format + VOICE_STYLE


async def _synthesize(index: int, sentence: str, tutor: str):
    spoken = speakable(sentence)
    if not spoken:
        return None

    started = time.perf_counter()
    audio_bytes, content_type = await tts.synthesize(spoken, tutor)
    return {
        'type': 'audio',
        'index': index,
        'text': spoken,
        'audio': audio_bytes,
        'content_type': content_type,
        'took_ms': round((time.perf_counter() - started) * 1000),
    }


async def _drain_audio(queue: asyncio.Queue, tasks: list):
    """Отдавать озвученные куски строго по порядку, хотя синтез идёт параллельно."""
    for task in tasks:
        try:
            event = await task
        except Exception:
            logger.exception('Voice synthesis failed for one sentence')
            continue
        if event:
            await queue.put(event)


async def _corrections_for(text: str, session):
    prompt = CORRECTIONS_PROMPT.format(
        language=ai_chat._sanitize_language(session.language),
        level=ai_chat._sanitize_level(session.level),
        native_language=ai_chat._sanitize_language(
            session.native_language or ai_chat.DEFAULT_NATIVE_LANGUAGE
        ),
        text=text,
    )
    raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
    candidate = ai_chat._extract_json_object(raw) or raw
    data = json.loads(candidate)
    return data.get('corrections', []) or []


async def _produce(queue: asyncio.Queue, session, user_text: str, tutor: str, db: AsyncSession):
    turn_started = time.perf_counter()
    timings = {}

    user_message = ChatMessages(session_id=session.id, role='user', text=user_text)
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    history = await ai_chat.get_recent_session_messages(session.id, db, limit=VOICE_HISTORY_MESSAGES)
    llm_messages = [{'role': 'system', 'content': _voice_system_prompt(session, tutor)}]
    for message in history:
        llm_messages.append(
            {'role': 'assistant' if message.role == 'assistant' else 'user', 'content': message.text}
        )
    llm_messages.append({'role': 'user', 'content': user_text})

    buffer = ''
    reply = ''
    index = 0
    voice_tasks = []
    drain = None

    async for delta in llm_client.stream_llm(llm_messages, max_tokens=VOICE_MAX_TOKENS):
        if 'first_token_ms' not in timings:
            timings['first_token_ms'] = round((time.perf_counter() - turn_started) * 1000)

        reply += delta
        buffer += delta
        await queue.put({'type': 'text', 'delta': delta})

        while True:
            sentence, buffer = take_sentence(buffer)
            if not sentence:
                break
            await queue.put({'type': 'sentence', 'index': index, 'text': sentence})
            voice_tasks.append(asyncio.create_task(_synthesize(index, sentence, tutor)))
            if drain is None:
                # Первое предложение уже в синтезе — с этого момента можно отдавать звук,
                # не дожидаясь, пока модель допишет остальное.
                drain = asyncio.create_task(_drain_audio(queue, voice_tasks))
            index += 1

    tail = buffer.strip()
    if tail:
        await queue.put({'type': 'sentence', 'index': index, 'text': tail})
        voice_tasks.append(asyncio.create_task(_synthesize(index, tail, tutor)))
        if drain is None:
            drain = asyncio.create_task(_drain_audio(queue, voice_tasks))

    timings['reply_done_ms'] = round((time.perf_counter() - turn_started) * 1000)

    if drain is not None:
        await drain
    timings['audio_done_ms'] = round((time.perf_counter() - turn_started) * 1000)

    assistant_message = ChatMessages(session_id=session.id, role='assistant', text=reply.strip())
    db.add(assistant_message)
    await db.commit()
    await db.refresh(assistant_message)

    corrections = []
    try:
        corrections = await _corrections_for(user_text, session)
    except Exception:
        logger.exception('Voice corrections failed for session %s', session.id)

    if corrections:
        user_message.corrections = corrections
        for correction in corrections:
            db.add(
                UserErrors(
                    user_id=session.user_id,
                    error_type='voice_correction',
                    original=correction.get('what', ''),
                    corrected=correction.get('better', ''),
                    explanation=correction.get('why'),
                )
            )
        await db.commit()

    xp_amount = ai_chat._practice_xp_amount(user_text, corrections)
    xp_transaction = None
    if xp_amount > 0:
        xp_transaction = await ratings.award_xp(session.user_id, 'ai_chat_practice', db, amount=xp_amount)

    timings['turn_ms'] = round((time.perf_counter() - turn_started) * 1000)

    await queue.put({
        'type': 'done',
        'message_id': assistant_message.id,
        'reply': assistant_message.text,
        'corrections': corrections,
        'xp_earned': xp_transaction.amount if xp_transaction else 0,
        'timings': timings,
    })


async def run_turn(session, user_text: str, db: AsyncSession, tutor: str = 'rose'):
    """Один ход разговора. Отдаёт события по мере готовности:

    {'type': 'text', 'delta': ...}                     — куски реплики для субтитров
    {'type': 'sentence', 'index': n, 'text': ...}      — предложение ушло в синтез
    {'type': 'audio', 'index': n, 'audio': bytes, ...} — озвучка, строго по порядку
    {'type': 'done', ...}                              — итог хода, разбор ошибок, XP
    """
    user_text = (user_text or '').strip()[:MAX_USER_TEXT]
    if not user_text:
        return

    queue = asyncio.Queue()
    producer = asyncio.create_task(_produce(queue, session, user_text, tutor, db))

    try:
        while True:
            getter = asyncio.create_task(queue.get())
            done, _ = await asyncio.wait({getter, producer}, return_when=asyncio.FIRST_COMPLETED)

            if getter in done:
                yield getter.result()
                continue

            getter.cancel()
            # Продюсер закончил (или упал) — забираем всё, что успело накопиться, и выходим.
            producer.result()
            while not queue.empty():
                yield queue.get_nowait()
            return
    finally:
        if not producer.done():
            producer.cancel()
