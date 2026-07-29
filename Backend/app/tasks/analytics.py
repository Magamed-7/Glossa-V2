from app.celery_app import celery_app


@celery_app.task(name='app.tasks.analytics.process_event')
def process_analytics_event(**kwargs):
    return kwargs
