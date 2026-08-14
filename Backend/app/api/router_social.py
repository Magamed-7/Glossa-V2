from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_social import FollowUserResponse, UserSearchResult
from app.services import crud_social, crud_user

router_social = APIRouter(prefix='/social', tags=['Social'])


@router_social.get('/search', response_model=list[UserSearchResult])
async def search_users(
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_social.search_users(current_user.id, db, q=q, limit=limit, offset=offset)


@router_social.get('/followers', response_model=list[FollowUserResponse])
async def get_followers(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    users = await crud_social.get_followers(current_user.id, db)
    from app.services import crud_subscription
    res = []
    for u in users:
        sub = await crud_subscription.get_active_subscription(u.id, db)
        tier = sub['plan'].code if sub else 'free'
        res.append({'id': u.id, 'username': u.username, 'subscription_tier': tier})
    return res


@router_social.get('/following', response_model=list[FollowUserResponse])
async def get_following(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    users = await crud_social.get_following(current_user.id, db)
    from app.services import crud_subscription
    res = []
    for u in users:
        sub = await crud_subscription.get_active_subscription(u.id, db)
        tier = sub['plan'].code if sub else 'free'
        res.append({'id': u.id, 'username': u.username, 'subscription_tier': tier})
    return res


@router_social.get('/friends', response_model=list[FollowUserResponse])
async def get_friends(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    users = await crud_social.get_friends(current_user.id, db)
    from app.services import crud_subscription
    res = []
    for u in users:
        sub = await crud_subscription.get_active_subscription(u.id, db)
        tier = sub['plan'].code if sub else 'free'
        res.append({'id': u.id, 'username': u.username, 'subscription_tier': tier})
    return res


@router_social.post('/follow/{user_id}', response_model=FollowUserResponse)
async def follow_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await crud_social.follow_user(current_user.id, user_id, db)
    u = await crud_user.get_by_id(user_id, db)
    from app.services import crud_subscription
    sub = await crud_subscription.get_active_subscription(u.id, db)
    tier = sub['plan'].code if sub else 'free'
    return {'id': u.id, 'username': u.username, 'subscription_tier': tier}


@router_social.delete('/follow/{user_id}')
async def unfollow_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    follow = await crud_social.unfollow_user(current_user.id, user_id, db)

    if follow is None:
        raise AppError(code='NOT_FOLLOWING', message='You are not following this user', status_code=404)

    return {'status': 'unfollowed'}
