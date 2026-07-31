import asyncio

from consumers.base import run_consumer
from app.tasks.content import process_content_event

if __name__ == '__main__':
    asyncio.run(run_consumer('content_events', 'content_consumers', 'content_consumer_1', process_content_event))
