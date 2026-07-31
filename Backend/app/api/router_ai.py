from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.event_bus import publish_event
from app.core.limits import require_ai_access
from app.db.database import get_db
from app.schemas.schema_ai import GenerateExerciseRequest, UserErrorResponse
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
