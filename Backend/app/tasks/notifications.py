import logging
import smtplib
from email.message import EmailMessage

from app.celery_app import celery_app
from app.core.config import settings

logger = logging.getLogger('notifications')


@celery_app.task(name='app.tasks.notifications.daily_review_reminders')
def daily_review_reminders(**kwargs):
    return kwargs


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
    logger.info('telegram to chat %s: %s - %s', chat_id, title, body)
    return 'logged'
