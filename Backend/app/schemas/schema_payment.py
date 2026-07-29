from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class BalanceResponse(BaseModel):
    balance: Decimal

    model_config = ConfigDict(from_attributes=True)


class TopupRequest(BaseModel):
    amount: Decimal
