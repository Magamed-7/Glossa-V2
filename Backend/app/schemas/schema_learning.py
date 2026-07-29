from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

CARD_STATUSES = Literal['learning', 'learned', 'hard', 'skipped']


class CardCreate(BaseModel):
    word: str
    translation: str
    example: str | None = None


class CardStatusUpdate(BaseModel):
    status: CARD_STATUSES


class CardResponse(BaseModel):
    id: int
    word: str
    translation: str
    example: str | None
    audio_url: str | None
    status: str
    ease_factor: float
    interval: int
    repetitions: int
    next_review_date: datetime | None
    created_at: datetime

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
