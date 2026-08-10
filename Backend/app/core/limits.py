from datetime import datetime, timedelta, timezone

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.core.redis_client import redis_client
from app.db.database import get_db

DAILY_LIMIT_FIELDS = {'stories_per_day', 'deck_words_per_day'}
WEEKLY_LIMIT_FIELDS = {'own_stories_per_week'}


def _seconds_until_midnight_utc():
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
    return int((tomorrow - now).total_seconds())


def _seconds_until_next_iso_week():
    now = datetime.now(timezone.utc)
    days_until_monday = (7 - now.weekday()) % 7 or 7
    next_monday = (now + timedelta(days=days_until_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
    return int((next_monday - now).total_seconds())


def daily_key(user_id: int, name: str):
    today = datetime.now(timezone.utc).date().isoformat()
    return f'limit:daily:{name}:{user_id}:{today}'


def weekly_key(user_id: int, name: str):
    year, week, _ = datetime.now(timezone.utc).isocalendar()
    return f'limit:weekly:{name}:{user_id}:{year}-W{week:02d}'


async def incr_daily(user_id: int, name: str):
    key = daily_key(user_id, name)
    value = await redis_client.incr(key)

    if value == 1:
        await redis_client.expire(key, _seconds_until_midnight_utc())

    return value


async def incr_weekly(user_id: int, name: str):
    key = weekly_key(user_id, name)
    value = await redis_client.incr(key)

    if value == 1:
        await redis_client.expire(key, _seconds_until_next_iso_week())

    return value


async def get_daily(user_id: int, name: str):
    value = await redis_client.get(daily_key(user_id, name))
    return int(value) if value else 0


async def get_weekly(user_id: int, name: str):
    value = await redis_client.get(weekly_key(user_id, name))
    return int(value) if value else 0


async def check_limit(user_id: int, name: str, db: AsyncSession):
    from app.services import crud_subscription

    subscription = await crud_subscription.get_active_subscription(user_id, db)
    limit = getattr(subscription['plan'], name)

    if limit is None:
        return True

    current = await get_daily(user_id, name) if name in DAILY_LIMIT_FIELDS else await get_weekly(user_id, name)
    return current < limit


async def enforce_story_limit(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await check_limit(current_user.id, 'stories_per_day', db):
        raise AppError(code='LIMIT_REACHED', message='Daily limit reached, upgrade your plan', status_code=403)

    await incr_daily(current_user.id, 'stories_per_day')
    return current_user


async def enforce_deck_word_limit(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await check_limit(current_user.id, 'deck_words_per_day', db):
        raise AppError(code='LIMIT_REACHED', message='Daily limit reached, upgrade your plan', status_code=403)

    await incr_daily(current_user.id, 'deck_words_per_day')
    return current_user


async def enforce_own_story_limit(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not await check_limit(current_user.id, 'own_stories_per_week', db):
        raise AppError(code='LIMIT_REACHED', message='Weekly limit reached, upgrade your plan', status_code=403)

    await incr_weekly(current_user.id, 'own_stories_per_week')
    return current_user


def ai_seconds_key(user_id: int):
    today = datetime.now(timezone.utc).date().isoformat()
    return f'ai:seconds:{user_id}:{today}'


async def get_ai_seconds_used(user_id: int):
    value = await redis_client.get(ai_seconds_key(user_id))
    return int(value) if value else 0


async def add_ai_seconds(user_id: int, seconds: int):
    key = ai_seconds_key(user_id)
    value = await redis_client.incrby(key, seconds)

    if value == seconds:
        await redis_client.expire(key, _seconds_until_midnight_utc())

    return value


async def check_ai_access(user_id: int, db: AsyncSession):
    from app.services import crud_subscription

    subscription = await crud_subscription.get_active_subscription(user_id, db)
    limit = subscription['plan'].ai_seconds_per_day

    if limit == 0:
        raise AppError(
            code='AI_ACCESS_DENIED', message='AI chat is available for premium plans', status_code=403
        )

    if limit is not None and await get_ai_seconds_used(user_id) >= limit:
        raise AppError(
            code='AI_LIMIT_REACHED', message='Daily AI time limit reached, upgrade your plan', status_code=403
        )


async def require_ai_access(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await check_ai_access(current_user.id, db)
    return current_user


async def check_leveled_vocab_limit(user_id: int, db: AsyncSession):
    from app.services import crud_subscription
    from app.models.model_card import Cards
    from sqlalchemy import select, func
    import datetime as dt

    subscription = await crud_subscription.get_active_subscription(user_id, db)
    plan_code = subscription['plan'].code

    if plan_code == 'free':
        stmt = select(func.count()).select_from(Cards).where(
            Cards.user_id == user_id,
            Cards.source_story_id < 0
        )
        res = await db.execute(stmt)
        total_count = res.scalar() or 0
        if total_count >= 5:
            raise AppError(
                code='LEVELED_VOCAB_LIMIT_REACHED',
                message='Free plan can only add up to 5 ready-made words in total',
                status_code=403
            )
            
    elif plan_code == 'premium':
        today_start = dt.datetime.now(dt.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.count()).select_from(Cards).where(
            Cards.user_id == user_id,
            Cards.source_story_id < 0,
            Cards.created_at >= today_start
        )
        res = await db.execute(stmt)
        daily_count = res.scalar() or 0
        if daily_count >= 55:
            raise AppError(
                code='LEVELED_VOCAB_LIMIT_REACHED',
                message='Premium plan can only add up to 55 ready-made words per day',
                status_code=403
            )


async def check_transcription_quota(user_id: int, db: AsyncSession):
    from app.services import crud_subscription
    from app.models.model_card import Cards
    from sqlalchemy import select, func
    import datetime as dt

    subscription = await crud_subscription.get_active_subscription(user_id, db)
    plan_code = subscription['plan'].code

    if plan_code == 'pro':
        return True

    if plan_code == 'free':
        stmt = select(func.count()).select_from(Cards).where(
            Cards.user_id == user_id,
            Cards.source_story_id.is_(None),
            Cards.transcription.is_not(None),
        )
        total = (await db.execute(stmt)).scalar() or 0
        return total < 5

    if plan_code == 'premium':
        today_start = dt.datetime.now(dt.timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        stmt = select(func.count()).select_from(Cards).where(
            Cards.user_id == user_id,
            Cards.source_story_id.is_(None),
            Cards.transcription.is_not(None),
            Cards.created_at >= today_start,
        )
        total = (await db.execute(stmt)).scalar() or 0
        return total < 50

    return True

