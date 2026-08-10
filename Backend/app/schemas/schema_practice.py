from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.schema_course import TestQuestionItem

PRACTICE_CATEGORIES = Literal['grammar', 'vocab', 'reading']
PRACTICE_SIZES = Literal['short', 'medium', 'long']


class PracticeEligibleLevelsResponse(BaseModel):
    current_level: str | None
    eligible_levels: list[str]


class PracticeTestGenerateRequest(BaseModel):
    cefr_levels: list[str] = Field(min_length=1)
    categories: list[PRACTICE_CATEGORIES] = Field(min_length=1)
    size: PRACTICE_SIZES = 'medium'
    grammar_lesson_ids: list[int] = []
    vocab_entry_ids: list[int] = []
    story_ids: list[int] = []


class LearnedContentResponse(BaseModel):
    grammar_lesson_ids: list[int]
    vocab_entry_ids: list[int]
    story_ids: list[int]


class PracticeTestGenerateResponse(BaseModel):
    attempt_id: int
    category: str
    cefr_levels: list[str]
    questions: list[TestQuestionItem]


class PracticeTestSubmitRequest(BaseModel):
    answers: dict[str, str]


class StoryTestGenerateResponse(BaseModel):
    attempt_id: int
    story_id: int
    cefr_level: str
    title: str
    questions: list[TestQuestionItem]


class StoryPracticeSummary(BaseModel):
    story_id: int
    title: str
    cefr_level: str
    genre: str | None = None
    is_read: bool
    attempts: int
    best_score_percent: float | None = None


class PracticeAnalyticsCategory(BaseModel):
    category: str
    attempts: int
    average_score_percent: float


class PracticeAnalyticsLevel(BaseModel):
    cefr_level: str
    attempts: int
    average_score_percent: float


class PracticeAnalyticsResponse(BaseModel):
    total_attempts: int
    average_score_percent: float
    pass_rate: float
    by_category: list[PracticeAnalyticsCategory]
    by_level: list[PracticeAnalyticsLevel]


class PracticeHistoryItem(BaseModel):
    id: int
    category: str
    cefr_levels: list[str]
    story_id: int | None
    score_percent: float | None
    started_at: datetime
    completed_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
