from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

SCENARIOS = Literal['casual', 'interview', 'restaurant', 'airport']


class ChatSessionCreate(BaseModel):
    scenario: SCENARIOS
    language: str


class ChatSessionResponse(BaseModel):
    id: int
    scenario: str
    language: str
    started_at: datetime
    seconds_spent: int

    model_config = ConfigDict(from_attributes=True)


class ChatMessageCreate(BaseModel):
    text: str


class Correction(BaseModel):
    what: str
    why: str
    better: str


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    text: str
    corrections: list[Correction] | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatReplyResponse(BaseModel):
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


class GenerateExerciseRequest(BaseModel):
    topic: str
    level: str


class UserErrorResponse(BaseModel):
    id: int
    error_type: str
    original: str
    corrected: str
    explanation: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
