from app.celery_app import celery_app


@celery_app.task(name='app.tasks.notifications.daily_review_reminders')
def daily_review_reminders(**kwargs):
    return kwargs
