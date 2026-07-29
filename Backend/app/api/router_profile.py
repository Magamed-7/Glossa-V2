from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.storage import upload_file
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


@router_profile.post('/me/photo', response_model=ProfileResponse)
async def upload_my_photo(
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    file_bytes = await file.read()
    photo_url = upload_file('avatars', file_bytes, file.filename, file.content_type)
    return await crud_profile.update_photo(current_user.id, photo_url, db)


@router_profile.post('/languages', response_model=LanguageResponse)
async def add_my_language(
    data: LanguageAdd,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_profile.add_language(current_user.id, data, db)
