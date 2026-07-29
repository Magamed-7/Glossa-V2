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
}

LEADERBOARD_GLOBAL_KEY = 'leaderboard:global'


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

    await redis_client.zincrby(LEADERBOARD_GLOBAL_KEY, amount, user_id)
    await redis_client.zincrby(weekly_leaderboard_key(), amount, user_id)

    return transaction


async def remove_from_leaderboards(user_id: int):
    await redis_client.zrem(LEADERBOARD_GLOBAL_KEY, user_id)
    await redis_client.zrem(weekly_leaderboard_key(), user_id)


async def rebuild_from_db(db: AsyncSession):
    await redis_client.delete(LEADERBOARD_GLOBAL_KEY)

    query = select(XpTransactions.user_id, func.sum(XpTransactions.amount)).group_by(XpTransactions.user_id)
    rows = (await db.execute(query)).all()

    for user_id, total in rows:
        settings = await crud_settings.get_settings(user_id, db)
        if settings.ratings_enabled:
            await redis_client.zadd(LEADERBOARD_GLOBAL_KEY, {str(user_id): total})


async def get_leaderboard(key: str, db: AsyncSession, limit: int = 20):
    entries = await redis_client.zrevrange(key, 0, limit - 1, withscores=True)

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
    rank = await redis_client.zrevrank(key, user_id)
    score = await redis_client.zscore(key, user_id)

    return {
        'rank': rank + 1 if rank is not None else None,
        'score': int(score) if score is not None else 0,
    }
