from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CARD_STATUSES = Literal['learning', 'learned', 'hard', 'skipped']


class CardCreate(BaseModel):
    word: str
    translation: str
    example: str | None = None
    source_story_id: int | None = None
    transcription: str | None = None
    audio_url: str | None = None
    accent: str | None = None


class CardStatusUpdate(BaseModel):
    status: CARD_STATUSES


class CardResponse(BaseModel):
    id: int
    word: str
    translation: str
    example: str | None
    audio_url: str | None
    transcription: str | None = None
    status: str
    ease_factor: float
    interval: int
    repetitions: int
    next_review_date: datetime | None
    created_at: datetime
    source_story_id: int | None = None

    model_config = ConfigDict(from_attributes=True)


class ReviewSubmit(BaseModel):
    quality: int = Field(ge=0, le=5)


class ReviewResponse(BaseModel):
    id: int
    status: str
    ease_factor: float
    interval: int
    repetitions: int
    next_review_date: datetime | None
    last_quality: int | None

    model_config = ConfigDict(from_attributes=True)


class LearningStats(BaseModel):
    cards_total: int
    due_today: int
    learned_count: int
    forgotten_count: int
    retention_rate: float


class DailyMissionItem(BaseModel):
    id: str
    title: str
    description: str
    progress: int
    target: int
    completed: bool


class OperationsLogDay(BaseModel):
    day: str
    date: date
    completed: bool


class DailyMissionsResponse(BaseModel):
    streak: int
    streak_maintained: bool
    xp_today: int
    xp_total: int
    xp_level_min: int
    xp_level_max: int
    rank: str
    operations_log: list[OperationsLogDay]
    daily_missions: list[DailyMissionItem]
    restores_used_this_month: int
    max_restores: int


