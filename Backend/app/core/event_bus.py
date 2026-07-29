import json

from redis.exceptions import ConnectionError as RedisConnectionError
from redis.exceptions import TimeoutError as RedisTimeoutError

from app.core.redis_client import redis_client

TOPICS = ('ai_tasks', 'analytics_events', 'payment_events', 'content_events')


async def publish_event(topic: str, payload: dict, fallback_task=None):
    try:
        await redis_client.xadd(topic, {'payload': json.dumps(payload)})
        return True
    except (RedisConnectionError, RedisTimeoutError):
        if fallback_task is not None:
            fallback_task.delay(**payload)
        return False
