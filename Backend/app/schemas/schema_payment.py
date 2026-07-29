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
