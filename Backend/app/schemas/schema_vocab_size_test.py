from datetime import datetime

from pydantic import BaseModel


class VocabSizeTestItem(BaseModel):
    id: int
    word: str


class VocabSizeTestStartResponse(BaseModel):
    attempt_id: int
    items: list[VocabSizeTestItem]


class VocabSizeTestSubmitRequest(BaseModel):
    known_ids: list[int]


class VocabSizeLevelResult(BaseModel):
    level: str
    known_rate: float
    estimated_words: int


class VocabSizeTestSubmitResponse(BaseModel):
    attempt_id: int
    by_level: list[VocabSizeLevelResult]
    estimated_total: int
    xp_earned: int


class VocabSizeTestConfirmRequest(BaseModel):
    accepted: bool
    adjusted_total: int | None = None


class VocabSizeTestConfirmResponse(BaseModel):
    estimated_vocabulary_size: int
    vocabulary_estimated_at: datetime
