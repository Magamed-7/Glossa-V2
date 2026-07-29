from celery import Celery

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

celery_app.conf.imports = ('app.tasks.ai', 'app.tasks.analytics', 'app.tasks.payments')


@celery_app.task(name='app.tasks.priority.ping')
def ping():
    return 'pong'
