from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class AchievementResponse(BaseModel):
    id: int
    code: str
    title: str
    description: str | None
    category: str
    threshold: int
    icon: str | None

    model_config = ConfigDict(from_attributes=True)


class MyAchievementResponse(BaseModel):
    id: int
    code: str
    title: str
    description: str | None
    category: str
    icon: str | None
    earned_at: datetime


class StreakResponse(BaseModel):
    current_streak: int
    best_streak: int
    last_activity_date: date | None

    model_config = ConfigDict(from_attributes=True)
