from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class UserStoryCreate(BaseModel):
    title: str
    body: str
    description: str | None = None
    cefr_level: str
    genre: str | None = None
    price: Decimal | None = None
    image_url: str | None = None


class UserStoryUpdate(BaseModel):
    title: str | None = None
    body: str | None = None
    description: str | None = None
    cefr_level: str | None = None
    genre: str | None = None
    price: Decimal | None = None
    image_url: str | None = None


class UserStoryResponse(BaseModel):
    id: int
    author_id: int
    title: str
    description: str | None
    cefr_level: str
    genre: str | None
    price: Decimal | None
    image_url: str | None
    status: str
    views_count: int
    created_at: datetime
    average_rating: float | None = None

    model_config = ConfigDict(from_attributes=True)


class UserStoryDetailResponse(BaseModel):
    id: int
    author_id: int
    title: str
    description: str | None = None
    cefr_level: str
    genre: str | None = None
    price: Decimal | None = None
    image_url: str | None = None
    status: str
    views_count: int
    created_at: datetime
    body: str | None = None
    word_dictionary: dict | None = None
    exercises: list | None = None


class ExerciseCreate(BaseModel):
    type: str
    question: str
    options: list | None = None
    answer: str
    explanation: str | None = None


class ExerciseResponse(BaseModel):
    id: int
    type: str
    question: str
    options: list | None
    answer: str
    explanation: str | None

    model_config = ConfigDict(from_attributes=True)


class ExerciseSubmitAnswer(BaseModel):
    exercise_id: int
    answer: str


class ExerciseSubmit(BaseModel):
    answers: list[ExerciseSubmitAnswer]


class ExerciseSubmitResult(BaseModel):
    total: int
    correct: int


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    text: str | None = None


class ReviewResponse(BaseModel):
    id: int
    user_id: int
    rating: int
    text: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthorStats(BaseModel):
    story_id: int
    title: str
    views_count: int
    purchases_count: int
    income: Decimal
    average_rating: float | None


class AuthorStatsResponse(BaseModel):
    stories: list[AuthorStats]
    total_views: int
    total_purchases: int
    total_income: Decimal
