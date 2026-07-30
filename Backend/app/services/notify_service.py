from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_profile import UserProfiles
from app.services import crud_notification, crud_settings, crud_user
from app.tasks.notifications import send_email_task, send_push_task, send_telegram_task


async def get_telegram_chat_id(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserProfiles.telegram_chat_id).where(UserProfiles.user_id == user_id))
    return result.scalar_one_or_none()


async def notify(user_id: int, type: str, title: str, body: str, db: AsyncSession):
    settings = await crud_settings.get_settings(user_id, db)

    if settings.telegram_enabled:
        chat_id = await get_telegram_chat_id(user_id, db)
    else:
        chat_id = None

    if chat_id is not None:
        send_telegram_task.delay(chat_id=chat_id, title=title, body=body)
    else:
        send_push_task.delay(user_id=user_id, title=title, body=body)
        await crud_notification.create_notification(user_id, type, title, db, body=body)

    if settings.email_enabled:
        user = await crud_user.get_by_id(user_id, db)
        send_email_task.delay(user_id=user_id, title=title, body=body, to_email=user.email)

    return True
