from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_achievement import AchievementResponse, MyAchievementResponse
from app.services import achievements

router_achievement = APIRouter(prefix='/achievements', tags=['Achievements'])


@router_achievement.get('', response_model=list[AchievementResponse])
async def get_achievements(db: AsyncSession = Depends(get_db)):
    return await achievements.get_all_achievements(db)


@router_achievement.get('/my', response_model=list[MyAchievementResponse])
async def get_my_achievements(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await achievements.get_my_achievements(current_user.id, db)
