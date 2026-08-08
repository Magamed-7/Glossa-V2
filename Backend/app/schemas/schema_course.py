from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ATOM_TYPES = Literal['vocabulary', 'grammar', 'story', 'review', 'ai_practice']


class OnboardingRequest(BaseModel):
    daily_minutes_budget: int = Field(ge=5, le=240)


class OnboardingStatus(BaseModel):
    onboarded: bool
    daily_minutes_budget: int | None = None


class CourseUnitSummary(BaseModel):
    id: int
    unit_code: str
    sequence_index: int
    cefr_level: str
    theme_title: str
    grammar_topic_label: str | None
    estimated_minutes: int
    is_level_midpoint: bool
    is_level_final: bool
    status: Literal['completed', 'in_progress', 'not_started']
    locked: bool

    model_config = ConfigDict(from_attributes=True)


class CourseUnitDetail(BaseModel):
    id: int
    unit_code: str
    sequence_index: int
    cefr_level: str
    theme_title: str
    locked: bool
    grammar_topic_label: str | None = None
    grammar_lesson_id: int | None = None
    story_ids: list[int] = []
    vocab_entry_ids: list[int] = []
    estimated_minutes: int | None = None
    is_level_midpoint: bool = False
    is_level_final: bool = False
    completed_atoms: list[str] = []
    status: Literal['completed', 'in_progress', 'not_started'] | None = None


class AtomCompleteRequest(BaseModel):
    time_spent_seconds: int = Field(ge=0, default=0)


class AtomCompletionResponse(BaseModel):
    id: int
    course_unit_id: int
    atom_type: str
    completed_at: datetime
    time_spent_seconds: int
    current_unit_id: int | None

    model_config = ConfigDict(from_attributes=True)


class TodayAtom(BaseModel):
    kind: Literal['review', 'vocabulary', 'grammar', 'story', 'next_unit_preview']
    course_unit_id: int | None = None
    unit_code: str | None = None
    theme_title: str | None = None
    estimated_minutes: int
    due_card_count: int | None = None
    grammar_lesson_id: int | None = None
    story_ids: list[int] | None = None
    vocab_entry_ids: list[int] | None = None


class TodayQueueResponse(BaseModel):
    budget_minutes: int
    used_minutes: int
    queue: list[TodayAtom]
    heavy_review_day: bool
    suggested_test: Literal['midpoint', 'final'] | None = None
    suggested_test_level: str | None = None


class CourseProgressResponse(BaseModel):
    total_units: int
    completed_units: int
    current_level: str | None
    current_unit_id: int | None
    projected_finish_date: date | None
    daily_minutes_budget: int | None
    level_breakdown: list[dict]


class LevelTestAvailability(BaseModel):
    available: bool
    cefr_level: str
    test_type: str
    reason: str | None = None


class LevelTestGenerateResponse(BaseModel):
    status: str
    attempt_id: int | None = None
