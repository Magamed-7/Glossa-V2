from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis_client import redis_client
from app.models.model_rating import XpTransactions
from app.services import crud_settings, crud_user

XP_REWARDS = {
    'review_passed': 10,
    'word_learned': 5,
    'story_written': 50,
    'review_received': 15,
    'social': 2,
    'login': 15,
}

LEADERBOARD_GLOBAL_KEY = 'leaderboard:global'


async def resolve_key(key: str):
    if key == LEADERBOARD_GLOBAL_KEY:
        season = await redis_client.get('leaderboard:global:current_season')
        if not season:
            season = '1'
            await redis_client.set('leaderboard:global:current_season', '1')
        return f'{LEADERBOARD_GLOBAL_KEY}:season:{season}'
    return key


def weekly_leaderboard_key(moment: datetime | None = None):
    moment = moment or datetime.now(timezone.utc)
    year, week, _ = moment.isocalendar()
    return f'leaderboard:week:{year}-W{week:02d}'


async def award_xp(user_id: int, reason: str, db: AsyncSession):
    settings = await crud_settings.get_settings(user_id, db)

    if not settings.ratings_enabled:
        return None

    amount = XP_REWARDS[reason]

    transaction = XpTransactions(user_id=user_id, amount=amount, reason=reason)
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)

    global_key = await resolve_key(LEADERBOARD_GLOBAL_KEY)
    await redis_client.zincrby(global_key, amount, user_id)
    await redis_client.zincrby(weekly_leaderboard_key(), amount, user_id)

    return transaction


async def remove_from_leaderboards(user_id: int):
    global_key = await resolve_key(LEADERBOARD_GLOBAL_KEY)
    await redis_client.zrem(global_key, user_id)
    await redis_client.zrem(weekly_leaderboard_key(), user_id)


async def rebuild_from_db(db: AsyncSession):
    global_key = await resolve_key(LEADERBOARD_GLOBAL_KEY)
    await redis_client.delete(global_key)

    season = await redis_client.get('leaderboard:global:current_season') or '1'
    start_at_str = await redis_client.get(f'{LEADERBOARD_GLOBAL_KEY}:season:{season}:start_at')

    query = select(XpTransactions.user_id, func.sum(XpTransactions.amount)).group_by(XpTransactions.user_id)
    if start_at_str:
        try:
            start_at = datetime.fromisoformat(start_at_str)
            query = query.where(XpTransactions.created_at >= start_at)
        except Exception:
            pass

    rows = (await db.execute(query)).all()

    for user_id, total in rows:
        settings = await crud_settings.get_settings(user_id, db)
        if settings.ratings_enabled:
            await redis_client.zadd(global_key, {str(user_id): total})


async def reset_global_leaderboard(db: AsyncSession):
    season_str = await redis_client.get('leaderboard:global:current_season')
    try:
        season = int(season_str) if season_str else 1
    except ValueError:
        season = 1
    new_season = str(season + 1)
    await redis_client.set('leaderboard:global:current_season', new_season)

    # Store start time of the new season (now)
    now_str = datetime.now(timezone.utc).isoformat()
    await redis_client.set(f'{LEADERBOARD_GLOBAL_KEY}:season:{new_season}:start_at', now_str)

    # Rebuild from db (which will now compute zero score since start_at is now)
    await rebuild_from_db(db)


async def get_leaderboard(key: str, db: AsyncSession, limit: int = 20):
    resolved_key = await resolve_key(key)
    entries = await redis_client.zrevrange(resolved_key, 0, limit - 1, withscores=True)

    if not entries:
        return []

    user_ids = [int(user_id) for user_id, _ in entries]
    users_by_id = await crud_user.get_by_ids(user_ids, db)

    return [
        {
            'rank': rank + 1,
            'user_id': user_id,
            'username': users_by_id[user_id].username if user_id in users_by_id else None,
            'score': int(score),
        }
        for rank, (user_id, score) in enumerate(zip(user_ids, (s for _, s in entries)))
    ]


async def get_my_rank(user_id: int, key: str):
    resolved_key = await resolve_key(key)
    rank = await redis_client.zrevrank(resolved_key, user_id)
    score = await redis_client.zscore(resolved_key, user_id)

    return {
        'rank': rank + 1 if rank is not None else None,
        'score': int(score) if score is not None else 0,
    }
