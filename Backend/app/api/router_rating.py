from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_rating import LeaderboardEntry, MyRankResponse
from app.services import crud_settings, ratings

router_rating = APIRouter(prefix='/leaderboard', tags=['Leaderboard'])


async def require_ratings_enabled(current_user, db: AsyncSession):
    settings = await crud_settings.get_settings(current_user.id, db)

    if not settings.ratings_enabled:
        raise AppError(
            code='RATINGS_DISABLED', message='Ratings are disabled in your settings', status_code=403
        )


@router_rating.get('/global', response_model=list[LeaderboardEntry])
async def get_global_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await require_ratings_enabled(current_user, db)
    return await ratings.get_leaderboard(ratings.LEADERBOARD_GLOBAL_KEY, db)


@router_rating.get('/weekly', response_model=list[LeaderboardEntry])
async def get_weekly_leaderboard(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await require_ratings_enabled(current_user, db)
    return await ratings.get_leaderboard(ratings.weekly_leaderboard_key(), db)


@router_rating.get('/me', response_model=MyRankResponse)
async def get_my_leaderboard_rank(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await require_ratings_enabled(current_user, db)
    return await ratings.get_my_rank(current_user.id, ratings.LEADERBOARD_GLOBAL_KEY)
