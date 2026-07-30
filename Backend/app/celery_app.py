from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    'glossa',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.task_routes = {
    'app.tasks.priority.*': {'queue': 'priority_queue'},
    'app.tasks.content.*': {'queue': 'content_queue'},
    'app.tasks.notifications.*': {'queue': 'notifications_queue'},
    'app.tasks.ai.*': {'queue': 'ai_queue'},
    'app.tasks.analytics.*': {'queue': 'analytics_queue'},
    'app.tasks.payments.*': {'queue': 'payments_queue'},
}

celery_app.conf.imports = ('app.tasks.ai', 'app.tasks.analytics', 'app.tasks.payments', 'app.tasks.notifications')

celery_app.conf.beat_schedule = {
    'daily-review-reminders': {
        'task': 'app.tasks.notifications.daily_review_reminders',
        'schedule': crontab(minute=0),
    },
    'hourly-leaderboard-rebuild': {
        'task': 'app.tasks.analytics.rebuild_leaderboards',
        'schedule': crontab(minute=0),
    },
    'nightly-achievements-check': {
        'task': 'app.tasks.analytics.nightly_achievements_check',
        'schedule': crontab(hour=3, minute=0),
    },
    'weekly-leaderboard-reset': {
        'task': 'app.tasks.analytics.reset_weekly_leaderboard',
        'schedule': crontab(day_of_week=1, hour=0, minute=0),
    },
    'daily-metrics-recompute': {
        'task': 'app.tasks.analytics.recompute_daily_metrics',
        'schedule': crontab(hour=2, minute=0),
    },
}


@celery_app.task(name='app.tasks.priority.ping')
def ping():
    return 'pong'
