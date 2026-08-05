from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.event_bus import publish_event
from app.core.limits import require_ai_access
from app.db.database import get_db
from app.schemas.schema_ai import (
    ChatMessageResponse,
    ChatSessionResponse,
    GenerateExerciseRequest,
    UserErrorResponse,
)
from app.services import ai_chat
from app.tasks.ai import process_ai_event

router_ai = APIRouter(prefix='/ai', tags=['AI'])


@router_ai.post('/exercises/generate')
async def generate_exercise(
    data: GenerateExerciseRequest,
    current_user=Depends(require_ai_access),
):
    payload = {'action': 'generate_exercise', 'topic': data.topic, 'level': data.level}
    published = await publish_event('ai_tasks', payload, fallback_task=process_ai_event)
    return {'queued': True, 'delivered_via': 'stream' if published else 'fallback_task'}


@router_ai.get('/errors/my', response_model=list[UserErrorResponse])
async def get_my_errors(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_ai_access),
):
    return await ai_chat.get_user_errors(current_user.id, db)


@router_ai.get('/sessions', response_model=list[ChatSessionResponse])
async def get_my_sessions(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_ai_access),
):
    return await ai_chat.get_user_sessions(current_user.id, db)


@router_ai.get('/sessions/{session_id}/messages', response_model=list[ChatMessageResponse])
async def get_my_session_messages(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_ai_access),
):
    session = await ai_chat.get_session(session_id, db)

    if session is None or session.user_id != current_user.id:
        raise AppError(code='SESSION_NOT_FOUND', message='Chat session not found', status_code=404)

    return await ai_chat.get_session_messages(session_id, db)
