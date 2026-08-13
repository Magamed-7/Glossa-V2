from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_achievement import StreakResponse
from app.services import streaks

router_streak = APIRouter(prefix='/streak', tags=['Streak'])


@router_streak.get('/my', response_model=StreakResponse)
async def get_my_streak(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await streaks.get_streak(current_user.id, db)
