from datetime import datetime

from pydantic import BaseModel


class GenerateStoryRequest(BaseModel):
    levels: list[str] = []
    word_status: str = 'all'
    approx_word_count: int = 150


class GeneratedStoryResponse(BaseModel):
    id: int
    body: str
    word_dictionary: dict | None
    cefr_levels: list[str]
    approx_word_count: int
    created_at: datetime


class GeneratedStorySummary(BaseModel):
    id: int
    cefr_levels: list[str]
    approx_word_count: int
    created_at: datetime
