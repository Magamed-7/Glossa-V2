from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.event_bus import publish_event
from app.models.model_payment import Purchases, UserBalances
from app.tasks.payments import process_payment_event


async def _get_locked_balance(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserBalances).where(UserBalances.user_id == user_id).with_for_update())
    balance = result.scalar_one_or_none()

    if balance is None:
        balance = UserBalances(user_id=user_id)
        db.add(balance)
        await db.flush()

    return balance


async def purchase(
    buyer_id: int,
    total_price: Decimal,
    item_type: str,
    db: AsyncSession,
    item_id: int | None = None,
    seller_id: int | None = None,
    seller_share: Decimal | None = None,
    create_entity=None,
):
    try:
        buyer_balance = await _get_locked_balance(buyer_id, db)

        if buyer_balance.balance < total_price:
            raise AppError(code='INSUFFICIENT_FUNDS', message='Insufficient balance', status_code=400)

        buyer_balance.balance -= total_price

        seller_income = None

        if seller_id is not None and seller_share is not None:
            seller_income = total_price * seller_share
            seller_balance = await _get_locked_balance(seller_id, db)
            seller_balance.balance += seller_income

        purchase_record = Purchases(
            buyer_id=buyer_id,
            item_type=item_type,
            item_id=item_id,
            amount=total_price,
            seller_id=seller_id,
            seller_income=seller_income,
        )
        db.add(purchase_record)

        if create_entity is not None:
            await create_entity(db)

        await db.commit()

        await publish_event(
            'payment_events',
            {
                'buyer_id': buyer_id,
                'item_type': item_type,
                'item_id': item_id,
                'amount': str(total_price),
                'seller_id': seller_id,
                'seller_income': str(seller_income) if seller_income is not None else None,
            },
            fallback_task=process_payment_event,
        )

        return purchase_record
    except Exception:
        await db.rollback()
        raise
