import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_ai_chat import ChatMessages, ChatSessions, UserErrors
from app.services import llm_client

SCENARIO_PROMPTS = {
    'casual': 'You are a friendly conversation partner having a casual chat about everyday life.',
    'interview': 'You are a hiring manager conducting a professional job interview.',
    'restaurant': 'You are a waiter taking an order and chatting with a customer at a restaurant.',
    'airport': 'You are an airport staff member helping a traveler with check-in and directions.',
    'telegram': 'You are a helpful, encouraging conversation partner chatting over Telegram.',
}

RESPONSE_INSTRUCTIONS = (
    'Reply to the learner in {language} as your character, staying fully in scenario. '
    'Then review the learner\'s last message for grammar or vocabulary mistakes. '
    'Respond with a single JSON object, no other text, in exactly this shape: '
    '{{"reply": "your in-character reply", "corrections": '
    '[{{"what": "the mistaken phrase", "why": "short explanation", "better": "the corrected phrase"}}]}}. '
    'If there are no mistakes, use an empty corrections list.'
)


def _system_prompt(scenario: str, language: str):
    scenario_text = SCENARIO_PROMPTS.get(scenario, SCENARIO_PROMPTS['casual'])
    return f'{scenario_text} {RESPONSE_INSTRUCTIONS.format(language=language)}'


def _parse_llm_response(raw_text: str):
    try:
        data = json.loads(raw_text)
        return data.get('reply', ''), data.get('corrections', []) or []
    except (json.JSONDecodeError, AttributeError):
        return raw_text, []


async def create_session(user_id: int, scenario: str, language: str, db: AsyncSession):
    session = ChatSessions(user_id=user_id, scenario=scenario, language=language)
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return session


async def get_session(session_id: int, db: AsyncSession):
    result = await db.execute(select(ChatSessions).where(ChatSessions.id == session_id))
    return result.scalar_one_or_none()


async def get_or_create_open_session(user_id: int, scenario: str, language: str, db: AsyncSession):
    result = await db.execute(
        select(ChatSessions)
        .where(ChatSessions.user_id == user_id, ChatSessions.scenario == scenario)
        .order_by(ChatSessions.id.desc())
    )
    session = result.scalars().first()

    if session is not None:
        return session

    return await create_session(user_id, scenario, language, db)


async def get_session_messages(session_id: int, db: AsyncSession):
    result = await db.execute(
        select(ChatMessages).where(ChatMessages.session_id == session_id).order_by(ChatMessages.id)
    )
    return result.scalars().all()


async def get_user_errors(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(UserErrors).where(UserErrors.user_id == user_id).order_by(UserErrors.created_at.desc())
    )
    return result.scalars().all()


async def send_message(session_id: int, text: str, db: AsyncSession):
    session = await get_session(session_id, db)
    history = await get_session_messages(session_id, db)

    user_message = ChatMessages(session_id=session_id, role='user', text=text)
    db.add(user_message)
    await db.commit()
    await db.refresh(user_message)

    llm_messages = [{'role': 'system', 'content': _system_prompt(session.scenario, session.language)}]
    for message in history:
        role = 'assistant' if message.role == 'assistant' else 'user'
        llm_messages.append({'role': role, 'content': message.text})
    llm_messages.append({'role': 'user', 'content': text})

    raw_reply = await llm_client.call_llm(llm_messages)
    reply_text, corrections = _parse_llm_response(raw_reply)

    if corrections:
        user_message.corrections = corrections
        await db.commit()
        await db.refresh(user_message)

        for correction in corrections:
            db.add(
                UserErrors(
                    user_id=session.user_id,
                    error_type='chat_correction',
                    original=correction.get('what', ''),
                    corrected=correction.get('better', ''),
                    explanation=correction.get('why'),
                )
            )
        await db.commit()

    assistant_message = ChatMessages(session_id=session_id, role='assistant', text=reply_text)
    db.add(assistant_message)
    await db.commit()
    await db.refresh(assistant_message)

    return {'user_message': user_message, 'assistant_message': assistant_message}
