from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_settings import SettingsResponse, SettingsUpdate
from app.services import crud_settings

router_settings = APIRouter(prefix='/settings', tags=['Settings'])


@router_settings.get('/me', response_model=SettingsResponse)
async def get_my_settings(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_settings.get_settings(current_user.id, db)


@router_settings.patch('/me', response_model=SettingsResponse)
async def update_my_settings(
    data: SettingsUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_settings.update_settings(current_user.id, data, db)
