from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_subscription import Plans, UserSubscriptions


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
