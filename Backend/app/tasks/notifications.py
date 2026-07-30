import asyncio
import logging
import smtplib
from datetime import datetime, timezone
from email.message import EmailMessage

from aiogram import Bot
from sqlalchemy import select

from app.celery_app import celery_app
from app.core.config import settings
from app.db.database import AsyncSessionLocal
from app.models.model_settings import UserSettings

logger = logging.getLogger('notifications')


@celery_app.task(name='app.tasks.notifications.daily_review_reminders')
def daily_review_reminders(**kwargs):
    from app.services import crud_content, notify_service, review, streaks

    async def run():
        current_hour = datetime.now(timezone.utc).strftime('%H:00')

        async with AsyncSessionLocal() as db:
            result = await db.execute(select(UserSettings).where(UserSettings.reminder_time == current_hour))
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

    return asyncio.run(run())


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

    return asyncio.run(run())
