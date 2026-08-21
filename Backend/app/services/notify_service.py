from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_profile import UserProfiles
from app.services import crud_notification, crud_settings, crud_user
from app.tasks.notifications import send_email_task, send_push_task, send_telegram_task


async def get_telegram_chat_id(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserProfiles.telegram_chat_id).where(UserProfiles.user_id == user_id))
    return result.scalar_one_or_none()


async def notify(user_id: int, type: str, title: str, body: str, db: AsyncSession, link: str | None = None):
    settings = await crud_settings.get_settings(user_id, db)

    # For review reminders, check telegram_sm2_enabled setting if channel is Telegram
    is_sm2_type = (type == 'review_reminder')
    if settings.telegram_enabled and (not is_sm2_type or settings.telegram_sm2_enabled):
        chat_id = await get_telegram_chat_id(user_id, db)
    else:
        chat_id = None

    # Always create an in-app notification first
    await crud_notification.create_notification(user_id, type, title, db, body=body, link=link)

    # Check if user is currently active (on-site) via Redis
    from app.core.redis_client import redis_client
    is_active = False
    try:
        active = await redis_client.get(f"user:active:{user_id}")
        is_active = active is not None
    except Exception:
        pass

    # If the user is already on the site, suppress external notifications
    if is_active:
        return True

    # Otherwise, dispatch to external channels (push/telegram/email)
    if chat_id is not None:
        send_telegram_task.delay(chat_id=chat_id, title=title, body=body)
    else:
        send_push_task.delay(user_id=user_id, title=title, body=body)

    if settings.email_enabled:
        user = await crud_user.get_by_id(user_id, db)
        send_email_task.delay(user_id=user_id, title=title, body=body, to_email=user.email)

    return True


async def notify_all_users_leaderboard_reset(period: str, db: AsyncSession):
    from app.models.model_user import Users
    from app.services import crud_settings

    result = await db.execute(select(Users).where(Users.is_active == True))
    users = result.scalars().all()

    for user in users:
        try:
            settings = await crud_settings.get_settings(user.id, db)
            locale = getattr(settings, 'interface_language', 'en')
            if locale not in ('en', 'ru', 'tg'):
                locale = 'en'

            if period == 'weekly':
                if locale == 'ru':
                    title = "Обнуление недельного рейтинга! 🏁"
                    body = "Началась новая неделя языкового соперничества! Скорее приступайте к занятиям, получайте XP и займите первое место в Реестре превосходства!"
                elif locale == 'tg':
                    title = "Оғози рейтинги ҳафтаинаи нав! 🏁"
                    body = "Ҳафтаи нави сабқати забоншиносӣ оғоз шуд! Ба омӯзиши дарсҳо оғоз кунед, холҳо (XP) гиред ва дар садри Феҳристи бартарӣ ҷой гиред!"
                else:
                    title = "Weekly Ledger Reset! 🏁"
                    body = "A fresh week of scholarly competition has commenced! Start studying now to claim the top spot on the Registry of Excellence!"
            else:
                if locale == 'ru':
                    title = "Новый сезон мирового рейтинга! 🏆"
                    body = "Глобальный рейтинг обнулился для нового сезона! Ваш путь к совершенству начинается сегодня — зарабатывайте очки и станьте абсолютным чемпионом!"
                elif locale == 'tg':
                    title = "Мавсими нави рейтинги ҷаҳонӣ! 🏆"
                    body = "Феҳристи ҷаҳонии бартарӣ барои мавсими нав оғоз шуд! Роҳи шумо ба сӯи мукаммалӣ имрӯз оғоз меёбад — холҳо ба даст оред ва қаҳрамон шавед!"
                else:
                    title = "Global Season Reset! 🏆"
                    body = "The Registry of Excellence has been reset for a new season! Your journey to language mastery starts today — rank up and become the champion!"

            await notify(user.id, "leaderboard_reset", title, body, db, link="/leaderboard")
        except Exception:
            pass

