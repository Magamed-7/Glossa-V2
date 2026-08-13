import json
import logging
import re

from sqlalchemy import select

from app.celery_app import celery_app
from app.core.task_loop import run_async
from app.db.database import AsyncSessionLocal
from app.models.model_content import GrammarLessons, GrammarQuestions
from app.services import llm_client

logger = logging.getLogger(__name__)

GENERATE_EXERCISE_PROMPT = """
You are a language teacher writing one fill-in-the-blank exercise for a CEFR {level}
learner on the topic "{topic}".

Requirements:
- The sentence must be something a person would actually say, in a realistic
  everyday situation — not a textbook specimen.
- Vocabulary must not exceed {level}. The exercise tests "{topic}", nothing else;
  do not make it hard for an unrelated reason.
- Exactly one blank, written as ___ .
- Provide 3-4 options. The distractors must be plausible — the specific forms a
  {level} learner really confuses, not obviously silly words.
- "explanation_en" must teach the rule in one or two warm sentences, so a learner
  who got it wrong understands WHY rather than just seeing the right answer.
  Never use the words wrong, incorrect, mistake or error.

Reply with a single JSON object and nothing else, in exactly this shape:
{{"text_en": "sentence with ___ in it",
  "options": ["option1", "option2", "option3"],
  "answer": "the correct option, exactly as written in options",
  "explanation_en": "warm explanation that teaches the rule"}}
"""


async def _get_or_create_lesson(topic: str, level: str, db):
    result = await db.execute(
        select(GrammarLessons).where(GrammarLessons.topic == topic, GrammarLessons.cefr_level == level)
    )
    lesson = result.scalar_one_or_none()

    if lesson is not None:
        return lesson

    lesson = GrammarLessons(cefr_level=level, lesson=topic, topic=topic)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


async def _generate_exercise(topic: str, level: str):
    async with AsyncSessionLocal() as db:
        lesson = await _get_or_create_lesson(topic, level, db)

        prompt = GENERATE_EXERCISE_PROMPT.format(level=level, topic=topic)
        raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
        data = json.loads(raw)

        question = GrammarQuestions(
            lesson_id=lesson.id,
            type='fill_blank',
            text_en=data.get('text_en'),
            options=data.get('options'),
            answer=data.get('answer', ''),
            explanation_en=data.get('explanation_en'),
        )
        db.add(question)
        await db.commit()
        await db.refresh(question)
        return question.id


@celery_app.task(name='app.tasks.ai.generate_exercise')
def generate_exercise_task(topic: str, level: str):
    return run_async(_generate_exercise(topic, level))


@celery_app.task(name='app.tasks.ai.process_event')
def process_ai_event(**kwargs):
    if kwargs.get('action') == 'generate_exercise':
        return generate_exercise_task(kwargs['topic'], kwargs['level'])

    return kwargs


async def _generate_card_transcription(card_id: int):
    from app.models.model_card import Cards
    from app.services import transcription, word_audio

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Cards).where(Cards.id == card_id))
        card = result.scalar_one_or_none()

        if card is None:
            return False

        value = await transcription.get_one(card.word, db)
        if value is not None:
            card.transcription = value

        level = await word_audio.level_for_user(card.user_id, db)
        audio = await word_audio.get_one(card.word, level, db)
        if audio is not None:
            card.audio_url = audio['audio_url']
            card.accent = audio['accent']

        if value is None and audio is None:
            return False

        db.add(card)
        await db.commit()
        return True


@celery_app.task(name='app.tasks.ai.generate_card_transcription')
def generate_card_transcription_task(card_id: int):
    return run_async(_generate_card_transcription(card_id))


GENERATE_STORY_DICTIONARY_PROMPT = (
    'You are building a click-a-word dictionary for an English text, for learners reading it with '
    'Russian or Tajik as their native language. Extract every unique English word that actually '
    'appears in the text below. Skip proper names, numbers, and short function words that carry no '
    'meaning on their own (articles "a/an/the", prepositions like "of/to/in/on/at"). Do NOT skip '
    '"am"/"is"/"are"/"was"/"were" just because they are short — learners specifically need these '
    'translated, so always include them (lemma "be").\n\n'
    'For each word, output three fields:\n'
    '1. "lemma" — the word\'s dictionary/citation form based on how it is used in THIS text: verbs '
    'go to the bare infinitive (e.g. "thinks"/"thought"/"thinking" -> "think", "am"/"is"/"was" -> '
    '"be", "left" as past tense of "leave" -> "leave", not the direction "left"), nouns go to the '
    'singular, adjectives/adverbs go to the base (positive, non-comparative) form.\n'
    '2. "ru" and "tg" — translate the LEMMA (not the inflected word) and give the translation in '
    'the matching dictionary/citation form: verbs as the infinitive (Russian "-ть/-ти/-чь", Tajik '
    '"-дан/-тан"), never a conjugated, imperative or command form. For example the lemma "think" '
    'must translate as ru "думать" and tg "фикр кардан" — never as an imperative like ru "думай!" '
    'or tg "фикр кунед". The lemma "be" (covering am/is/are/was/were) must translate as ru "быть" '
    'and tg "будан" — never as a pronoun like "я"/"ту"/"ман" and never as the specific conjugated '
    'form that happened to appear in the text.\n'
    '3. If — and only if — the lemma has two genuinely different common meanings (e.g. "average" as '
    '"typical/ordinary" vs. "a calculated mean"; "left" as "departed" vs. "not right"), translate it '
    'as it is actually used in THIS text as the primary sense, then add the other common meaning in '
    'parentheses, e.g. ru "обычный (тж. средний)". Words that are not genuinely ambiguous get a '
    'single plain translation — do not invent a second sense that is not a real common meaning of '
    'the word.\n\n'
    'Respond ONLY with a single JSON object where keys are the lowercase original words exactly as '
    'they appear in the text, and values are objects with keys "lemma", "ru", "tg". '
    'Example: {{"apples": {{"lemma": "apple", "ru": "яблоко", "tg": "себ"}}, '
    '"thinks": {{"lemma": "think", "ru": "думать", "tg": "фикр кардан"}}, '
    '"am": {{"lemma": "be", "ru": "быть", "tg": "будан"}}}}. '
    'Ensure you return a valid JSON object. No markdown formatting or backticks around the json. '
    'Text:\n{text}'
)

WORDS_PER_DICTIONARY_CHUNK = 1500
ALWAYS_INCLUDED_SHORT_WORDS = {'am', 'is', 'are', 'was', 'were'}
MIN_CHUNK_COVERAGE = 0.5
DICTIONARY_ATTEMPTS_PER_CHUNK = 2


def _chunk_words(text: str, words_per_chunk: int = WORDS_PER_DICTIONARY_CHUNK):
    words = text.split()

    for i in range(0, len(words), words_per_chunk):
        yield ' '.join(words[i:i + words_per_chunk])


def _candidate_words(text: str):
    found = re.findall(r"[a-zA-Z]+(?:'[a-zA-Z]+)?", text.lower())
    return {w for w in found if len(w) >= 3 or w in ALWAYS_INCLUDED_SHORT_WORDS}


def _chunk_dictionary_looks_complete(chunk: str, dictionary_data: dict):
    # Модель не всегда честно "извлекает каждое слово" из текста, как просит промпт — иногда
    # тихо возвращает валидный, но урезанный JSON (проверено вживую: 41 → 15 → 21 слово на
    # одном и том же куске между запусками). Отличить "мало непонятных слов в коротком тексте"
    # от "модель обрезала вывод" по одному только исключению JSON нельзя — считаем покрытие.
    candidates = _candidate_words(chunk)
    if not candidates:
        return True
    covered = sum(1 for w in candidates if w in dictionary_data)
    return covered / len(candidates) >= MIN_CHUNK_COVERAGE


def _strip_code_fence(raw: str):
    raw = raw.strip()

    if raw.startswith('```json'):
        raw = raw[len('```json'):]
    elif raw.startswith('```'):
        raw = raw[len('```'):]

    if raw.endswith('```'):
        raw = raw[:-len('```')]

    return raw.strip()


async def _generate_story_dictionary(story_id: int, story_type: str = 'system'):
    from app.models.model_content import Stories
    from app.models.model_user_story import UserStories

    # story_type distingue две независимые таблицы с одинаковым по смыслу полем
    # word_dictionary — system 'stories' (тексты платформы) и 'user_stories' (истории
    # авторов из Author Studio). Раньше эта задача всегда лезла в Stories по id,
    # который мог принадлежать user_stories — совпадение id тихо портило чужую
    # системную историю, а несовпадение просто оставляло словарь пустым навсегда.
    model = Stories if story_type == 'system' else UserStories
    text_field = 'body_en' if story_type == 'system' else 'body'

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(model).where(model.id == story_id))
        story = result.scalar_one_or_none()

        if not story:
            return False

        # Длинная история в одном запросе легко упирается в лимит вывода модели и обрывает
        # JSON на середине — режем на куски, склеиваем словари; при сбое любого куска не
        # сохраняем частично собранный словарь (лучше пусто, чем тихо неполно).
        dictionary_data = {}

        for chunk in _chunk_words(getattr(story, text_field)):
            prompt = GENERATE_STORY_DICTIONARY_PROMPT.format(text=chunk)
            chunk_data = None

            for attempt in range(DICTIONARY_ATTEMPTS_PER_CHUNK):
                try:
                    raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
                    parsed = json.loads(_strip_code_fence(raw))
                except Exception:
                    logger.exception('Failed to generate word dictionary chunk for story %s (attempt %s)', story_id, attempt + 1)
                    continue

                if _chunk_dictionary_looks_complete(chunk, parsed):
                    chunk_data = parsed
                    break

                logger.warning(
                    'Word dictionary chunk for story %s looked incomplete on attempt %s (%s words), retrying',
                    story_id, attempt + 1, len(parsed),
                )
                chunk_data = parsed

            if chunk_data is None:
                return False

            dictionary_data.update(chunk_data)

        story.word_dictionary = dictionary_data
        db.add(story)
        await db.commit()
        return True


@celery_app.task(name='app.tasks.ai.generate_story_dictionary')
def generate_story_dictionary_task(story_id: int, story_type: str = 'system'):
    return run_async(_generate_story_dictionary(story_id, story_type))


async def _generate_word_audio_batch(words: list[str], level: str):
    from app.services import word_audio

    async with AsyncSessionLocal() as db:
        await word_audio.generate_missing(words, level, db)
        return True


@celery_app.task(name='app.tasks.ai.generate_word_audio_batch')
def generate_word_audio_batch_task(words: list[str], level: str):
    return run_async(_generate_word_audio_batch(words, level))


async def _generate_story_audio(story_id: int):
    from app.core.storage import ALLOWED_AUDIO_TYPES, upload_file
    from app.core.tts_voices import pick_accent
    from app.models.model_content import Stories
    from app.services import tts

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Stories).where(Stories.id == story_id))
        story = result.scalar_one_or_none()

        if story is None:
            return False

        accent = pick_accent(story.cefr_level)

        try:
            audio_bytes, content_type = await tts.synthesize(story.body_en, accent)
        except Exception:
            logger.exception('Failed to synthesize audio for story %s', story_id)
            return False

        extension = 'mp3' if content_type == 'audio/mpeg' else 'wav'
        audio_url = upload_file(
            'story-audio', audio_bytes, f'story-{story_id}.{extension}', content_type, ALLOWED_AUDIO_TYPES
        )

        story.audio_url = audio_url
        story.accent = accent
        db.add(story)
        await db.commit()
        return True


@celery_app.task(name='app.tasks.ai.generate_story_audio')
def generate_story_audio_task(story_id: int):
    return run_async(_generate_story_audio(story_id))
