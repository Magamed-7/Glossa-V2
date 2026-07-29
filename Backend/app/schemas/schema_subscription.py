from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict


class PlanResponse(BaseModel):
    id: int
    code: str
    price_monthly: float
    price_yearly: float
    stories_per_day: int | None
    deck_words_per_day: int | None
    own_stories_per_week: int | None
    ai_seconds_per_day: int | None
    can_buy_stories: bool
    telegram_access: bool

    model_config = ConfigDict(from_attributes=True)


class MySubscriptionResponse(BaseModel):
    plan: PlanResponse
    period: str | None
    expires_at: datetime | None
    is_active: bool


class SubscribeRequest(BaseModel):
    plan_code: str
    period: Literal['monthly', 'yearly']
