import asyncio

from consumers.base import run_consumer
from app.tasks.payments import process_payment_event

if __name__ == '__main__':
    asyncio.run(run_consumer('payment_events', 'payments_consumers', 'payments_consumer_1', process_payment_event))
