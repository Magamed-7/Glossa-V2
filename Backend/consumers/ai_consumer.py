import asyncio

from consumers.base import run_consumer
from app.tasks.ai import process_ai_event

if __name__ == '__main__':
    asyncio.run(run_consumer('ai_tasks', 'ai_consumers', 'ai_consumer_1', process_ai_event))
