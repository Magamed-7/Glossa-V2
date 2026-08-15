from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DcWebhookPayload(BaseModel):
    text: str
    source: str
    received_at: datetime


class CreateOrderRequest(BaseModel):
    intent: str  # 'top_up' | 'subscription'
    base_amount: Decimal | None = None  # required for top_up
    plan_code: str | None = None  # required for subscription
    period: str | None = None  # required for subscription: 'monthly' | 'yearly'


class OrderResponse(BaseModel):
    id: int
    intent: str
    plan_code: str | None
    period: str | None
    base_amount: Decimal
    expected_amount: Decimal
    status: str
    created_at: datetime
    expires_at: datetime
    paid_at: datetime | None

    model_config = ConfigDict(from_attributes=True)
