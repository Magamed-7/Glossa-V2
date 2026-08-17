from decimal import Decimal

from sqlalchemy import func, select
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


async def topup_balance(user_id: int, amount: Decimal, db: AsyncSession):
    if amount <= 0:
        raise AppError(code='INVALID_AMOUNT', message='Amount must be positive', status_code=400)

    balance = await get_or_create_balance(user_id, db)
    balance.balance += amount
    db.add(Purchases(buyer_id=user_id, item_type='topup', amount=amount))

    await db.commit()
    await db.refresh(balance)
    return balance


async def get_payment_history(user_id: int, db: AsyncSession, limit: int = 20, offset: int = 0):
    result = await db.execute(
        select(Purchases)
        .where(Purchases.buyer_id == user_id)
        .order_by(Purchases.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_payment_analytics(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(
            Purchases.item_type,
            func.count(Purchases.id),
            func.coalesce(func.sum(Purchases.amount), 0),
        )
        .where(Purchases.buyer_id == user_id)
        .group_by(Purchases.item_type)
    )
    rows = result.all()

    total_topped_up = Decimal('0')
    total_spent = Decimal('0')
    by_category = []

    for item_type, count, total_amount in rows:
        if item_type == 'topup':
            total_topped_up += total_amount
        else:
            total_spent += total_amount
            by_category.append({'item_type': item_type, 'count': count, 'total_amount': total_amount})

    by_category.sort(key=lambda row: row['total_amount'], reverse=True)

    return {
        'total_topped_up': total_topped_up,
        'total_spent': total_spent,
        'by_category': by_category,
    }
