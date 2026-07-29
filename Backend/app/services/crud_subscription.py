from datetime import datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_subscription import Plans, UserSubscriptions
from app.services import purchase_service


async def get_plans(db: AsyncSession):
    result = await db.execute(select(Plans))
    return result.scalars().all()


async def get_plan_by_code(code: str, db: AsyncSession):
    result = await db.execute(select(Plans).where(Plans.code == code))
    return result.scalar_one_or_none()


async def get_active_subscription(user_id: int, db: AsyncSession):
    now = datetime.now(timezone.utc)

    result = await db.execute(
        select(UserSubscriptions).where(
            UserSubscriptions.user_id == user_id,
            UserSubscriptions.is_active.is_(True),
            UserSubscriptions.expires_at > now,
        )
    )
    subscription = result.scalar_one_or_none()

    if subscription is not None:
        plan = await db.get(Plans, subscription.plan_id)
        return {
            'plan': plan,
            'period': subscription.period,
            'expires_at': subscription.expires_at,
            'is_active': subscription.is_active,
        }

    free_plan = await get_plan_by_code('free', db)
    return {
        'plan': free_plan,
        'period': None,
        'expires_at': None,
        'is_active': True,
    }


async def subscribe_to_plan(user_id: int, plan_code: str, period: str, db: AsyncSession):
    plan = await get_plan_by_code(plan_code, db)

    if plan is None:
        raise AppError(code='PLAN_NOT_FOUND', message='Plan not found', status_code=404)

    price = plan.price_monthly if period == 'monthly' else plan.price_yearly
    duration = timedelta(days=30) if period == 'monthly' else timedelta(days=365)
    expires_at = datetime.now(timezone.utc) + duration

    async def create_entity(db: AsyncSession):
        await db.execute(
            update(UserSubscriptions)
            .where(UserSubscriptions.user_id == user_id, UserSubscriptions.is_active.is_(True))
            .values(is_active=False)
        )
        db.add(
            UserSubscriptions(
                user_id=user_id, plan_id=plan.id, period=period, expires_at=expires_at, is_active=True
            )
        )

    await purchase_service.purchase(
        user_id, price, 'subscription', db, item_id=plan.id, create_entity=create_entity
    )

    return await get_active_subscription(user_id, db)
