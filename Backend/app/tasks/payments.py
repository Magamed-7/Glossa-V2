from app.celery_app import celery_app


@celery_app.task(name='app.tasks.payments.process_event')
def process_payment_event(**kwargs):
    return kwargs
