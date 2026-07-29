import logging

from app.celery_app import celery_app

logger = logging.getLogger('payments')


@celery_app.task(name='app.tasks.payments.process_event')
def process_payment_event(**kwargs):
    logger.info('payment audit: %s', kwargs)

    seller_id = kwargs.get('seller_id')
    seller_income = kwargs.get('seller_income')

    if seller_id and seller_income:
        logger.info('seller %s income updated by %s', seller_id, seller_income)
        logger.info('notify seller %s about sale (real delivery wired in phase 12)', seller_id)

    return kwargs
