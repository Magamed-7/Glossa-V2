from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.limits import require_ai_access
from app.db.database import get_db
from app.schemas.schema_context_help import (
    ContextHelpSendRequest,
    ContextHelpSendResponse,
    ContextHelpStartRequest,
    ContextHelpStartResponse,
)
from app.services import ai_context_help

router_context_help = APIRouter(prefix='/ai/context-help', tags=['AI Context Help'])


@router_context_help.post('/start', response_model=ContextHelpStartResponse)
async def start(
    data: ContextHelpStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_ai_access),
):
    session = await ai_context_help.get_or_create_session(
        current_user.id, data.context_type, data.context_ref_id, data.language, db, force_new=data.force_new
    )
    messages = await ai_context_help.get_session_messages(session.id, db)
    return {'session_id': session.id, 'messages': messages}


@router_context_help.post('/{session_id}/message', response_model=ContextHelpSendResponse)
async def send(
    session_id: int,
    data: ContextHelpSendRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_ai_access),
):
    return await ai_context_help.send_message(current_user.id, session_id, data.text, db)
