import asyncio

from consumers.base import run_consumer
from app.tasks.analytics import process_analytics_event

if __name__ == '__main__':
    asyncio.run(run_consumer('analytics_events', 'analytics_consumers', 'analytics_consumer_1', process_analytics_event))
