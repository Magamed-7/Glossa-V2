import json

from redis.exceptions import ResponseError
from redis.exceptions import TimeoutError as RedisTimeoutError

from app.core.redis_client import redis_client


async def consume_once(stream: str, group: str, consumer_name: str, task, count: int = 10, block_ms: int = 1000):
    try:
        await redis_client.xgroup_create(stream, group, id='0', mkstream=True)
    except ResponseError:
        pass

    try:
        response = await redis_client.xreadgroup(group, consumer_name, {stream: '>'}, count=count, block=block_ms)
    except RedisTimeoutError:
        response = None

    processed = 0

    if response:
        for _, messages in response:
            for message_id, fields in messages:
                payload = json.loads(fields['payload'])
                task.delay(**payload)
                await redis_client.xack(stream, group, message_id)
                processed += 1

    return processed


async def run_consumer(stream: str, group: str, consumer_name: str, task):
    while True:
        await consume_once(stream, group, consumer_name, task, block_ms=5000)
