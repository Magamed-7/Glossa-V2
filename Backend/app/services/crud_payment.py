from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_payment import Purchases, UserBalances


async def get_or_create_balance(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserBalances).where(UserBalances.user_id == user_id))
    balance = result.scalar_one_or_none()

    if balance is None:
        balance = UserBalances(user_id=user_id)
        db.add(balance)
        await db.commit()
        await db.refresh(balance)

    return balance


async def topup_balance(user_id: int, amount: Decimal, db: AsyncSession, stripe_event_id: str | None = None):
    if amount <= 0:
        raise AppError(code='INVALID_AMOUNT', message='Amount must be positive', status_code=400)

    balance = await get_or_create_balance(user_id, db)
    balance.balance += amount
    db.add(Purchases(buyer_id=user_id, item_type='topup', amount=amount, stripe_event_id=stripe_event_id))

    await db.commit()
    await db.refresh(balance)
    return balance


async def stripe_event_already_processed(stripe_event_id: str, db: AsyncSession):
    result = await db.execute(select(Purchases).where(Purchases.stripe_event_id == stripe_event_id))
    return result.scalar_one_or_none() is not None


async def get_payment_history(user_id: int, db: AsyncSession, limit: int = 20, offset: int = 0):
    result = await db.execute(
        select(Purchases)
        .where(Purchases.buyer_id == user_id)
        .order_by(Purchases.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
