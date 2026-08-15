import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_ai_chat import ChatMessages, ChatSessions
from app.models.model_profile import UserLanguages
from app.services import llm_client
from app.services.ai_chat import DEFAULT_LEVEL, DEFAULT_NATIVE_LANGUAGE, LEVEL_GUIDANCE, _sanitize_language, _sanitize_level

logger = logging.getLogger(__name__)

SCENARIO = 'context_help'
SESSION_FRESHNESS = timedelta(hours=24)
MAX_MESSAGE_LENGTH = 1000
HISTORY_WINDOW_MESSAGES = 12

CONTEXT_TYPES = {'story', 'grammar', 'exercise'}

HELP_CORE = """
You are the Glossa study-help assistant. The learner is right now looking at a
specific piece of material inside the app (shown to you below as CURRENT
MATERIAL) and may ask you a quick question about it — a word, a sentence, a
grammar point, why an answer is right or wrong. You already know exactly what
they're looking at, so never ask them to explain or paste the material — just
answer using what's given below.

Keep answers short and focused: 2-5 sentences, plain text, no markdown, no JSON.
Match the learner's level below. If their question is unrelated to the material
or to learning English, gently steer back.
"""


def _story_context(story) -> str:
    body = getattr(story, 'body_en', None) or getattr(story, 'body', None) or ''
    title = getattr(story, 'title_en', None) or getattr(story, 'title', None) or ''
    return f'CURRENT MATERIAL — a story titled "{title}" (CEFR {story.cefr_level}):\n{body[:4000]}'


def _grammar_context(lesson) -> str:
    parts = [f'CURRENT MATERIAL — a grammar lesson: "{lesson.topic}" (CEFR {lesson.cefr_level}).']
    if lesson.rule_en:
        parts.append(f'Rule: {lesson.rule_en}')
    if lesson.structure:
        parts.append(f'Structure: {lesson.structure}')
    if lesson.explanation_long_en:
        parts.append(f'Full explanation given to the learner:\n{lesson.explanation_long_en}')
    return '\n'.join(parts)


def _exercise_context(question) -> str:
    return (
        f'CURRENT MATERIAL — a grammar exercise question: "{question.text_en}"\n'
        f'Correct answer: {question.answer}\n'
        f'Explanation already shown for it: {question.explanation_en or "(none)"}'
    )


async def _resolve_context_text(context_type: str, context_ref_id: int, db: AsyncSession) -> str:
    if context_type == 'story':
        from app.models.model_content import Stories
        story = (await db.execute(select(Stories).where(Stories.id == context_ref_id))).scalar_one_or_none()
        if story is None:
            raise AppError(code='CONTEXT_NOT_FOUND', message='Story not found', status_code=404)
        return _story_context(story)

    if context_type == 'grammar':
        from app.models.model_content import GrammarLessons
        lesson = (await db.execute(select(GrammarLessons).where(GrammarLessons.id == context_ref_id))).scalar_one_or_none()
        if lesson is None:
            raise AppError(code='CONTEXT_NOT_FOUND', message='Lesson not found', status_code=404)
        return _grammar_context(lesson)

    if context_type == 'exercise':
        from app.models.model_content import GrammarQuestions
        question = (await db.execute(select(GrammarQuestions).where(GrammarQuestions.id == context_ref_id))).scalar_one_or_none()
        if question is None:
            raise AppError(code='CONTEXT_NOT_FOUND', message='Exercise not found', status_code=404)
        return _exercise_context(question)

    raise AppError(code='INVALID_CONTEXT_TYPE', message='Unknown context type', status_code=400)


async def _resolve_target_level(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(UserLanguages).where(UserLanguages.user_id == user_id, UserLanguages.is_target.is_(True))
    )
    language = result.scalars().first()
    return language.level if language is not None else DEFAULT_LEVEL


async def get_or_create_session(user_id: int, context_type: str, context_ref_id: int, language: str, db: AsyncSession):
    if context_type not in CONTEXT_TYPES:
        raise AppError(code='INVALID_CONTEXT_TYPE', message='Unknown context type', status_code=400)

    result = await db.execute(
        select(ChatSessions)
        .where(
            ChatSessions.user_id == user_id,
            ChatSessions.scenario == SCENARIO,
            ChatSessions.context_type == context_type,
            ChatSessions.context_ref_id == context_ref_id,
        )
        .order_by(ChatSessions.id.desc())
    )
    session = result.scalars().first()

    if session is not None and datetime.now(timezone.utc) - session.started_at < SESSION_FRESHNESS:
        return session

    level = await _resolve_target_level(user_id, db)
    session = ChatSessions(
        user_id=user_id,
        scenario=SCENARIO,
        language=_sanitize_language(language),
        level=_sanitize_level(level),
        native_language=DEFAULT_NATIVE_LANGUAGE,
        context_type=context_type,
        context_ref_id=context_ref_id,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session_messages(session_id: int, db: AsyncSession):
    result = await db.execute(
        select(ChatMessages).where(ChatMessages.session_id == session_id).order_by(ChatMessages.id)
    )
    return result.scalars().all()


async def _recent_messages(session_id: int, db: AsyncSession):
    result = await db.execute(
        select(ChatMessages)
        .where(ChatMessages.session_id == session_id)
        .order_by(ChatMessages.id.desc())
        .limit(HISTORY_WINDOW_MESSAGES)
    )
    return list(reversed(result.scalars().all()))


def _system_prompt(context_text: str, language: str, level: str, native_language: str):
    safe_level = _sanitize_level(level)
    guidance = LEVEL_GUIDANCE[safe_level].format(
        language=_sanitize_language(language), native_language=_sanitize_language(native_language)
    )
    return f'{HELP_CORE}\nLEARNER LEVEL\n{guidance}\n\n{context_text}'


async def send_message(user_id: int, session_id: int, text: str, db: AsyncSession):
    text = text[:MAX_MESSAGE_LENGTH]

    session = (
        await db.execute(select(ChatSessions).where(ChatSessions.id == session_id, ChatSessions.user_id == user_id))
    ).scalar_one_or_none()
    if session is None:
        raise AppError(code='SESSION_NOT_FOUND', message='Session not found', status_code=404)

    context_text = await _resolve_context_text(session.context_type, session.context_ref_id, db)
    history = await _recent_messages(session_id, db)

    user_message = ChatMessages(session_id=session_id, role='user', text=text)
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    messages = [{'role': 'system', 'content': _system_prompt(context_text, session.language, session.level, session.native_language)}]
    for message in history:
        role = 'assistant' if message.role == 'assistant' else 'user'
        messages.append({'role': role, 'content': message.text})
    messages.append({'role': 'user', 'content': text})

    try:
        reply_text = await llm_client.call_llm(messages, json_mode=False)
    except Exception:
        logger.exception('Context-help reply failed for session %s', session_id)
        reply_text = "Sorry, I couldn't answer that just now — try again in a moment."

    assistant_message = ChatMessages(session_id=session_id, role='assistant', text=reply_text)
    db.add(assistant_message)
    await db.commit()
    await db.refresh(assistant_message)

    return {'user_message': user_message, 'assistant_message': assistant_message}
