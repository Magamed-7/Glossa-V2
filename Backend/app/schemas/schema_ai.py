from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

SCENARIOS = Literal[
    'casual', 'interview', 'restaurant', 'airport', 'telegram',
    'shopping', 'doctor', 'debate', 'adventure', 'newfriend',
]


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
    severity: Literal['minor', 'worth_fixing', 'blocks_meaning'] = 'worth_fixing'


class ChatMessageResponse(BaseModel):
    id: int
    role: str
    text: str
    corrections: list[Correction] | None
    encouragement: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ChatReplyResponse(BaseModel):
    user_message: ChatMessageResponse
    assistant_message: ChatMessageResponse


class SessionAnalysisResponse(BaseModel):
    recommendation: str
    topics: list[str]
    xp_earned: int


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
