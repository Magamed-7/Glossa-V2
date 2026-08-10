import logging
import smtplib
from datetime import datetime, timezone, timedelta, date
from email.message import EmailMessage

from aiogram import Bot
from sqlalchemy import select

from app.celery_app import celery_app
from app.core.config import settings
from app.core.task_loop import run_async
from app.core.redis_client import redis_client
from app.db.database import AsyncSessionLocal
from app.models.model_settings import UserSettings

logger = logging.getLogger('notifications')


@celery_app.task(name='app.tasks.notifications.daily_review_reminders')
def daily_review_reminders(**kwargs):
    from app.services import crud_content, notify_service, review, streaks

    async def run():
        # Convert UTC to local GMT+5 time
        local_time = datetime.now(timezone.utc) + timedelta(hours=5)
        current_hour_local = local_time.strftime('%H')

        async with AsyncSessionLocal() as db:
            # Match settings where reminder_time starts with current_hour_local (e.g., "19:20" matches at hour 19)
            result = await db.execute(
                select(UserSettings).where(UserSettings.reminder_time.like(f"{current_hour_local}:%"))
            )
            due_settings = result.scalars().all()

            sent = 0

            for user_settings in due_settings:
                if not (user_settings.push_enabled or user_settings.telegram_enabled or user_settings.email_enabled):
                    continue

                user_id = user_settings.user_id
                due_cards = await review.get_due_cards(user_id, db)

                if not due_cards:
                    continue

                weak_topics = await crud_content.get_weak_topics(user_id, db)
                streak = await streaks.get_streak(user_id, db)

                weak_topic_names = ', '.join(t['topic'] for t in weak_topics[:3]) if weak_topics else 'none'
                body = (
                    f'You have {len(due_cards)} words to review today.\n'
                    f'Weak topics: {weak_topic_names}\n'
                    f'Current streak: {streak.current_streak} days'
                )

                await notify_service.notify(user_id, 'review_reminder', 'Time to study!', body, db)
                sent += 1

            return sent

    return run_async(run())


@celery_app.task(name='app.tasks.priority.send_email')
def send_email_task(user_id: int, title: str, body: str, to_email: str):
    message = EmailMessage()
    message['Subject'] = title
    message['From'] = settings.DEFAULT_FROM_EMAIL
    message['To'] = to_email
    message.set_content(body)

    with smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT) as smtp:
        if settings.EMAIL_USE_TLS:
            smtp.starttls()
        smtp.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
        smtp.send_message(message)

    return 'sent'


@celery_app.task(name='app.tasks.notifications.send_push')
def send_push_task(user_id: int, title: str, body: str):
    logger.info('push to user %s: %s - %s', user_id, title, body)
    return 'logged'


@celery_app.task(name='app.tasks.notifications.send_telegram')
def send_telegram_task(chat_id: str, title: str, body: str):
    async def run():
        bot = Bot(token=settings.TG_BOT)
        text = f'{title}\n\n{body}' if body else title

        try:
            await bot.send_message(chat_id=chat_id, text=text)
        finally:
            await bot.session.close()

        return 'sent'

    return run_async(run())


@celery_app.task(name='app.tasks.notifications.sm2_repetition_reminders')
def sm2_repetition_reminders(**kwargs):
    from app.services import notify_service, crud_settings
    from app.models.model_card import Cards

    async def run():
        now = datetime.now(timezone.utc)
        tomorrow = now + timedelta(days=1)
        one_hour = now + timedelta(hours=1)

        async with AsyncSessionLocal() as db:
            # 1. Day Before Reminders
            day_before_q = select(Cards).where(
                Cards.next_review_date <= tomorrow,
                Cards.next_review_date > now,
                Cards.day_before_notified == False
            )
            res = await db.execute(day_before_q)
            day_before_cards = res.scalars().all()

            # Group by user_id
            day_before_groups = {}
            for card in day_before_cards:
                day_before_groups.setdefault(card.user_id, []).append(card)

            for user_id, cards in day_before_groups.items():
                try:
                    settings = await crud_settings.get_settings(user_id, db)
                    locale = getattr(settings, 'interface_language', 'en')
                    count = len(cards)

                    if locale == 'ru':
                        title = "Напоминание о повторении"
                        body = f"Завтра вам нужно будет повторить {count} слов(а). Не прерывайте свою серию!"
                    elif locale == 'tg':
                        title = "Ёдраси оид ба такрор"
                        body = f"Пагоҳ ба шумо лозим аст, ки {count} калимаро такрор кунед. Силсилаи худро қатъ накунед!"
                    else:
                        title = "Review reminder"
                        body = f"You have {count} words scheduled for review tomorrow. Keep up your streak!"

                    await notify_service.notify(user_id, 'review_reminder', title, body, db)

                    # Mark as notified
                    for card in cards:
                        card.day_before_notified = True
                except Exception:
                    logger.exception("Failed sending day_before reminder for user %s", user_id)

            # 2. Hour Before Reminders
            hour_before_q = select(Cards).where(
                Cards.next_review_date <= one_hour,
                Cards.next_review_date > now,
                Cards.hour_notified == False
            )
            res = await db.execute(hour_before_q)
            hour_before_cards = res.scalars().all()

            hour_before_groups = {}
            for card in hour_before_cards:
                hour_before_groups.setdefault(card.user_id, []).append(card)

            for user_id, cards in hour_before_groups.items():
                try:
                    settings = await crud_settings.get_settings(user_id, db)
                    locale = getattr(settings, 'interface_language', 'en')
                    count = len(cards)

                    if locale == 'ru':
                        title = "Повторение через 1 час"
                        body = f"Напоминаем: через час наступит время повторить {count} слов(а)."
                    elif locale == 'tg':
                        title = "Такрор пас аз 1 соат"
                        body = f"Ёдрас мекунем: пас аз як соат вақти такрори {count} калима фаро мерасад."
                    else:
                        title = "Review in 1 hour"
                        body = f"Friendly heads-up: {count} words will be due for review in one hour."

                    await notify_service.notify(user_id, 'review_reminder', title, body, db)

                    for card in cards:
                        card.hour_notified = True
                except Exception:
                    logger.exception("Failed sending hour_before reminder for user %s", user_id)

            # 3. Due Now Reminders
            due_now_q = select(Cards).where(
                Cards.next_review_date <= now,
                Cards.due_notified == False
            )
            res = await db.execute(due_now_q)
            due_now_cards = res.scalars().all()

            due_now_groups = {}
            for card in due_now_cards:
                due_now_groups.setdefault(card.user_id, []).append(card)

            for user_id, cards in due_now_groups.items():
                try:
                    settings = await crud_settings.get_settings(user_id, db)
                    locale = getattr(settings, 'interface_language', 'en')
                    count = len(cards)

                    if locale == 'ru':
                        title = "Время повторения слов"
                        body = f"У вас есть {count} слов(а) для повторения прямо сейчас. Давайте потренируемся!"
                    elif locale == 'tg':
                        title = "Вақти такрори калимаҳо"
                        body = f"Ҳоло вақти такрори {count} калима расидааст. Биёед машқ кунем!"
                    else:
                        title = "Words due for review"
                        body = f"You have {count} words due for review right now. Let's practice!"

                    await notify_service.notify(user_id, 'review_reminder', title, body, db)

                    for card in cards:
                        card.due_notified = True
                except Exception:
                    logger.exception("Failed sending due_now reminder for user %s", user_id)

            await db.commit()
            return 'processed'

    return run_async(run())


@celery_app.task(name='app.tasks.notifications.streak_protection_reminders')
def streak_protection_reminders(**kwargs):
    from app.services import notify_service, crud_settings
    from app.models.model_achievement import UserStreaks

    async def run():
        today_date = date.today()
        today_str = today_date.isoformat()

        async with AsyncSessionLocal() as db:
            res = await db.execute(select(UserStreaks).where(UserStreaks.current_streak > 0))
            active_streaks = res.scalars().all()

            for streak in active_streaks:
                if streak.last_activity_date == today_date:
                    continue

                redis_key = f"user:streak_warning:{streak.user_id}:{today_str}"
                already_warned = await redis_client.get(redis_key)
                if already_warned:
                    continue

                try:
                    settings = await crud_settings.get_settings(streak.user_id, db)
                    locale = getattr(settings, 'interface_language', 'en')
                    streak_days = streak.current_streak

                    if locale == 'ru':
                        title = "Сохраните свою серию! 🔥"
                        body = f"Не потеряйте вашу серию из {streak_days} дн.! Вы ещё не занимались сегодня. Начните урок прямо сейчас, чтобы сохранить её."
                    elif locale == 'tg':
                        title = "Силсилаи худро ҳифз кунед! 🔥"
                        body = f"Силсилаи {streak_days} рӯзаи худро қатъ накунед! Шумо имрӯз ҳанӯз машқ накардаед. Барои нигоҳ доштани он ҳозир дарсро оғоз кунед."
                    else:
                        title = "Keep your streak! 🔥"
                        body = f"Don't lose your {streak_days}-day streak! You haven't practiced today yet. Study now to keep it active."

                    await notify_service.notify(streak.user_id, 'streak_warning', title, body, db)
                    await redis_client.set(redis_key, '1', ex=86400)
                except Exception:
                    logger.exception("Failed sending streak warning to user %s", streak.user_id)

            return 'processed'

    return run_async(run())

