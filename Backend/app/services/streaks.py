from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_achievement import UserStreaks


async def get_streak(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserStreaks).where(UserStreaks.user_id == user_id))
    streak = result.scalar_one_or_none()

    if streak is None:
        streak = UserStreaks(user_id=user_id)
        db.add(streak)
        await db.commit()
        await db.refresh(streak)

    return streak


async def touch_streak(user_id: int, db: AsyncSession):
    streak = await get_streak(user_id, db)
    today = date.today()

    if streak.last_activity_date == today:
        return streak

    if streak.last_activity_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.best_streak = max(streak.best_streak, streak.current_streak)
    streak.last_activity_date = today

    await db.commit()
    await db.refresh(streak)
    return streak
