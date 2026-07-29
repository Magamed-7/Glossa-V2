from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BalanceResponse(BaseModel):
    balance: Decimal

    model_config = ConfigDict(from_attributes=True)


class TopupRequest(BaseModel):
    amount: Decimal


class CheckoutSessionRequest(BaseModel):
    amount: Decimal
    currency: str = 'usd'


class CheckoutSessionResponse(BaseModel):
    url: str


class PaymentHistoryEntry(BaseModel):
    id: int
    item_type: str
    item_id: int | None
    amount: Decimal
    seller_income: Decimal | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
