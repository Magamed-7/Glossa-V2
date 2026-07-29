from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_payment import UserBalances


async def get_or_create_balance(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserBalances).where(UserBalances.user_id == user_id))
    balance = result.scalar_one_or_none()

    if balance is None:
        balance = UserBalances(user_id=user_id)
        db.add(balance)
        await db.commit()
        await db.refresh(balance)

    return balance


async def topup_balance(user_id: int, amount: Decimal, db: AsyncSession):
    if amount <= 0:
        raise AppError(code='INVALID_AMOUNT', message='Amount must be positive', status_code=400)

    balance = await get_or_create_balance(user_id, db)
    balance.balance += amount

    await db.commit()
    await db.refresh(balance)
    return balance
