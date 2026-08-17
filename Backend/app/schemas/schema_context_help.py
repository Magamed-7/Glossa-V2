from datetime import datetime

from pydantic import BaseModel


class ContextHelpStartRequest(BaseModel):
    context_type: str
    context_ref_id: int
    language: str = 'English'
    force_new: bool = False


class ContextHelpMessage(BaseModel):
    id: int
    role: str
    text: str
    created_at: datetime


class ContextHelpStartResponse(BaseModel):
    session_id: int
    messages: list[ContextHelpMessage]


class ContextHelpSendRequest(BaseModel):
    text: str


class ContextHelpSendResponse(BaseModel):
    user_message: ContextHelpMessage
    assistant_message: ContextHelpMessage
