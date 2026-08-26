from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.core.storage import ALLOWED_CHAT_FILE_TYPES, PICTURE_MAX_SIDE, read_upload, upload_file
from app.db.database import get_db
from app.schemas.schema_messenger import (
    AttachmentResponse,
    ConversationResponse,
    MessageResponse,
    StartConversationRequest,
)
from app.services import crud_messenger, turn_credentials

router_messenger = APIRouter(prefix='/messenger', tags=['Messenger'])


@router_messenger.get('/ice-servers')
async def get_ice_servers(current_user=Depends(get_current_user)):
    return {'ice_servers': await turn_credentials.get_ice_servers(current_user.id)}


async def _conversation_to_response(conversation, user_id: int, db: AsyncSession):
    other_user = None
    if not conversation.is_group:
        other_user = await crud_messenger.get_other_participant(conversation.id, user_id, db)

    last_message = await crud_messenger.get_last_message(conversation.id, db)
    unread_count = await crud_messenger.get_unread_count(conversation.id, user_id, db)

    return {
        'id': conversation.id,
        'is_group': conversation.is_group,
        'title': conversation.title,
        'other_user': other_user,
        'last_message': last_message,
        'unread_count': unread_count,
        'last_message_at': conversation.last_message_at,
    }


@router_messenger.get('/conversations', response_model=list[ConversationResponse])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conversations = await crud_messenger.get_my_conversations(current_user.id, db)
    return [await _conversation_to_response(c, current_user.id, db) for c in conversations]


@router_messenger.post('/conversations', response_model=ConversationResponse)
async def start_conversation(
    data: StartConversationRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    conversation = await crud_messenger.get_or_create_direct_conversation(current_user.id, data.user_id, db)
    return await _conversation_to_response(conversation, current_user.id, db)


@router_messenger.get('/conversations/{conversation_id}/messages', response_model=list[MessageResponse])
async def get_messages(
    conversation_id: int,
    before_id: int | None = None,
    limit: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    participant = await crud_messenger.is_participant(conversation_id, current_user.id, db)
    if participant is None:
        raise AppError(code='NOT_A_PARTICIPANT', message='You are not part of this conversation', status_code=403)

    return await crud_messenger.get_messages(conversation_id, db, before_id=before_id, limit=limit)


@router_messenger.post('/conversations/{conversation_id}/read')
async def mark_conversation_read(
    conversation_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    participant = await crud_messenger.mark_read(conversation_id, current_user.id, db)
    if participant is None:
        raise AppError(code='NOT_A_PARTICIPANT', message='You are not part of this conversation', status_code=403)

    return {'status': 'ok'}


@router_messenger.post('/conversations/{conversation_id}/attachments', response_model=AttachmentResponse)
async def upload_attachment(
    conversation_id: int,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    participant = await crud_messenger.is_participant(conversation_id, current_user.id, db)
    if participant is None:
        raise AppError(code='NOT_A_PARTICIPANT', message='You are not part of this conversation', status_code=403)

    file_bytes = await read_upload(file)
    url = upload_file('chat-attachments', file_bytes, file.filename, file.content_type, ALLOWED_CHAT_FILE_TYPES, max_side=PICTURE_MAX_SIDE)
    return {'url': url, 'name': file.filename, 'content_type': file.content_type}
