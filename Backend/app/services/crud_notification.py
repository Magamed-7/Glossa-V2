from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_notification import Notifications


async def create_notification(user_id: int, type: str, title: str, db: AsyncSession, body: str | None = None):
    # Enforce limit of 15 notifications max (3 pages of 5 items)
    # Delete oldest if count exceeds 14 before adding a new one
    from sqlalchemy import func, delete
    count = await db.scalar(
        select(func.count()).select_from(Notifications).where(Notifications.user_id == user_id)
    )
    if count >= 15:
        old_ids_q = (
            select(Notifications.id)
            .where(Notifications.user_id == user_id)
            .order_by(Notifications.created_at.desc())
            .offset(14)
        )
        res = await db.execute(old_ids_q)
        old_ids = res.scalars().all()
        if old_ids:
            await db.execute(delete(Notifications).where(Notifications.id.in_(old_ids)))

    notification = Notifications(user_id=user_id, type=type, title=title, body=body)
    db.add(notification)
    await db.commit()
    await db.refresh(notification)
    return notification


async def get_notifications(user_id: int, db: AsyncSession, limit: int = 20, offset: int = 0):
    result = await db.execute(
        select(Notifications)
        .where(Notifications.user_id == user_id)
        .order_by(Notifications.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()


async def get_notification(notification_id: int, db: AsyncSession):
    result = await db.execute(select(Notifications).where(Notifications.id == notification_id))
    return result.scalar_one_or_none()


async def mark_read(notification_id: int, user_id: int, db: AsyncSession):
    notification = await get_notification(notification_id, db)

    if notification is None or notification.user_id != user_id:
        return None

    notification.is_read = True
    await db.commit()
    await db.refresh(notification)
    return notification


async def mark_all_read(user_id: int, db: AsyncSession):
    await db.execute(
        update(Notifications)
        .where(Notifications.user_id == user_id, Notifications.is_read.is_(False))
        .values(is_read=True)
    )
    await db.commit()
