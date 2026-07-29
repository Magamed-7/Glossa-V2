from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_social import Follows
from app.models.model_user import Users


async def is_following(follower_id: int, following_id: int, db: AsyncSession):
    result = await db.execute(
        select(Follows).where(Follows.follower_id == follower_id, Follows.following_id == following_id)
    )
    return result.scalar_one_or_none()


async def is_mutual(user_a: int, user_b: int, db: AsyncSession):
    a_follows_b = await is_following(user_a, user_b, db)
    b_follows_a = await is_following(user_b, user_a, db)
    return a_follows_b is not None and b_follows_a is not None


async def follow_user(follower_id: int, following_id: int, db: AsyncSession):
    if follower_id == following_id:
        raise AppError(code='CANNOT_FOLLOW_SELF', message='You cannot follow yourself', status_code=400)

    existing = await is_following(follower_id, following_id, db)

    if existing is not None:
        raise AppError(code='ALREADY_FOLLOWING', message='You are already following this user', status_code=400)

    follow = Follows(follower_id=follower_id, following_id=following_id)
    db.add(follow)
    await db.commit()
    await db.refresh(follow)
    return follow


async def unfollow_user(follower_id: int, following_id: int, db: AsyncSession):
    follow = await is_following(follower_id, following_id, db)

    if follow is None:
        return None

    await db.delete(follow)
    await db.commit()
    return follow


async def get_followers(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Users).join(Follows, Follows.follower_id == Users.id).where(Follows.following_id == user_id)
    )
    return result.scalars().all()


async def get_following(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Users).join(Follows, Follows.following_id == Users.id).where(Follows.follower_id == user_id)
    )
    return result.scalars().all()


async def get_friends(user_id: int, db: AsyncSession):
    followers = await get_followers(user_id, db)
    following = await get_following(user_id, db)

    following_ids = {u.id for u in following}
    return [u for u in followers if u.id in following_ids]
