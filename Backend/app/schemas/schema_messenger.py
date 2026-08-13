from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

MESSAGE_TYPES = Literal['text', 'voice', 'file', 'call']


class StartConversationRequest(BaseModel):
    user_id: int


class ParticipantResponse(BaseModel):
    id: int
    username: str
    photo_url: str | None = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    type: str
    text: str | None
    attachment_url: str | None
    attachment_name: str | None
    attachment_duration_seconds: int | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: int
    is_group: bool
    title: str | None
    other_user: ParticipantResponse | None
    last_message: MessageResponse | None
    unread_count: int
    last_message_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AttachmentResponse(BaseModel):
    url: str
    name: str
    content_type: str
