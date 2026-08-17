from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BalanceResponse(BaseModel):
    balance: Decimal

    model_config = ConfigDict(from_attributes=True)


class PaymentHistoryEntry(BaseModel):
    id: int
    item_type: str
    item_id: int | None
    amount: Decimal
    seller_income: Decimal | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SpendingByCategory(BaseModel):
    item_type: str
    count: int
    total_amount: Decimal


class PaymentAnalyticsResponse(BaseModel):
    total_topped_up: Decimal
    total_spent: Decimal
    by_category: list[SpendingByCategory]
