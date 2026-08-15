import logging

from app.celery_app import celery_app
from app.core.task_loop import run_async

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


@celery_app.task(name='app.tasks.payments.expire_dc_orders')
def expire_dc_orders():
    from datetime import datetime, timezone

    from sqlalchemy import update

    from app.db.database import AsyncSessionLocal
    from app.models.model_dc_payment import Order

    async def run():
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                update(Order)
                .where(Order.status == 'pending', Order.expires_at <= datetime.now(timezone.utc))
                .values(status='expired')
            )
            await db.commit()
            return result.rowcount

    expired_count = run_async(run())
    if expired_count:
        logger.info('expired %s dc orders', expired_count)
    return expired_count
