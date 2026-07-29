from typing import Literal

from pydantic import BaseModel, ConfigDict

DIFFICULTY_LEVELS = Literal['easy', 'medium', 'hard']


class SettingsUpdate(BaseModel):
    target_language: str | None = None
    daily_goal: int | None = None
    study_time: str | None = None
    difficulty: DIFFICULTY_LEVELS | None = None
    email_enabled: bool | None = None
    push_enabled: bool | None = None
    telegram_enabled: bool | None = None
    reminder_time: str | None = None
    ratings_enabled: bool | None = None
    profile_visible: bool | None = None


class SettingsResponse(BaseModel):
    target_language: str | None
    daily_goal: int
    study_time: str | None
    difficulty: str
    email_enabled: bool
    push_enabled: bool
    telegram_enabled: bool
    reminder_time: str | None
    ratings_enabled: bool
    profile_visible: bool

    model_config = ConfigDict(from_attributes=True)
