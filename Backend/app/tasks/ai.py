from app.celery_app import celery_app


@celery_app.task(name='app.tasks.ai.process_event')
def process_ai_event(**kwargs):
    return kwargs
