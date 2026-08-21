from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_achievement import UserStreaks


def is_broken(streak, today: date | None = None):
    """True once a whole day has gone by without study."""
    today = today or date.today()
    return streak.last_activity_date is not None and streak.last_activity_date < today - timedelta(days=1)


async def get_streak(user_id: int, db: AsyncSession):
    """The streak as it stands right now, with a missed day already counted against it.

    A streak used to keep its old number until the learner came back and did something,
    so someone who stopped a week ago still saw their old count on the header. A missed
    day ends the streak the moment the day is over, and the number it had is kept aside
    so a restore can still bring it back.
    """
    result = await db.execute(select(UserStreaks).where(UserStreaks.user_id == user_id))
    streak = result.scalar_one_or_none()

    if streak is None:
        streak = UserStreaks(user_id=user_id)
        db.add(streak)
        await db.commit()
        await db.refresh(streak)
        return streak

    if is_broken(streak) and streak.current_streak > 0:
        streak.prev_streak_before_reset = max(streak.prev_streak_before_reset, streak.current_streak)
        streak.current_streak = 0
        await db.commit()
        await db.refresh(streak)

    return streak


async def touch_streak(user_id: int, db: AsyncSession):
    """Count today's study. Only real learning calls this — opening the site does not."""
    streak = await get_streak(user_id, db)
    today = date.today()

    if streak.last_activity_date == today:
        return streak

    if streak.last_activity_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        if streak.current_streak > 1:
            streak.prev_streak_before_reset = streak.current_streak
        streak.current_streak = 1

    streak.best_streak = max(streak.best_streak, streak.current_streak)
    streak.last_activity_date = today

    await db.commit()
    await db.refresh(streak)
    return streak
