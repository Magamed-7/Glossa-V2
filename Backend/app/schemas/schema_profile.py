from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

from app.schemas.schema_achievement import MyAchievementResponse

CEFR_LEVELS = Literal['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']


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
    level: str | None = None
    is_target: bool

    model_config = ConfigDict(from_attributes=True)


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    bio: str | None
    interests: list[str] | None
    photo_url: str | None
    profile_views: int
    telegram_chat_id: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PrivacyUpdate(BaseModel):
    show_stories_count: bool | None = None
    show_achievements: bool | None = None
    show_current_streak: bool | None = None
    show_best_streak: bool | None = None
    show_languages: bool | None = None
    show_language_levels: bool | None = None
    show_followers: bool | None = None


class PrivacyResponse(BaseModel):
    show_stories_count: bool
    show_achievements: bool
    show_current_streak: bool
    show_best_streak: bool
    show_languages: bool
    show_language_levels: bool
    show_followers: bool

    model_config = ConfigDict(from_attributes=True)


class PublicProfileResponse(BaseModel):
    user_id: int
    username: str
    bio: str | None = None
    interests: list[str] | None = None
    photo_url: str | None = None
    profile_views: int
    languages: list[LanguageResponse] | None = None
    followers_count: int | None = None
    following_count: int | None = None
    friends_count: int | None = None
    current_streak: int | None = None
    best_streak: int | None = None
    stories_read_count: int | None = None
    achievements: list[MyAchievementResponse] | None = None

    model_config = ConfigDict(from_attributes=True)
