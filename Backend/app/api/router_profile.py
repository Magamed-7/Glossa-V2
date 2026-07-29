from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_profile import LanguageAdd, LanguageResponse, ProfileResponse, ProfileUpdate
from app.services import crud_profile

router_profile = APIRouter(prefix='/profile', tags=['Profile'])


@router_profile.get('/me', response_model=ProfileResponse)
async def get_my_profile(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_profile.get_profile(current_user.id, db)


@router_profile.patch('/me', response_model=ProfileResponse)
async def update_my_profile(
    data: ProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_profile.update_profile(current_user.id, data, db)


@router_profile.post('/languages', response_model=LanguageResponse)
async def add_my_language(
    data: LanguageAdd,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_profile.add_language(current_user.id, data, db)
