from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

CEFR_LEVELS = Literal['A1', 'A2', 'B1', 'B2', 'C1', 'C2']


class ProfileUpdate(BaseModel):
    bio: str | None = None
    interests: list[str] | None = None


class LanguageAdd(BaseModel):
    language: str
    level: CEFR_LEVELS = 'A1'
    is_target: bool = True


class LanguageResponse(BaseModel):
    id: int
    language: str
    level: str
    is_target: bool

    model_config = ConfigDict(from_attributes=True)


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: str | None
    interests: list[str] | None
    photo_url: str | None
    profile_views: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PublicProfileResponse(BaseModel):
    user_id: int
    username: str
    bio: str | None = None
    interests: list[str] | None = None
    photo_url: str | None = None
    profile_views: int
    languages: list[LanguageResponse] | None = None

    model_config = ConfigDict(from_attributes=True)
