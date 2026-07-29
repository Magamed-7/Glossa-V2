from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.core.storage import upload_file
from app.db.database import get_db
from app.schemas.schema_profile import (
    LanguageAdd,
    LanguageResponse,
    PrivacyResponse,
    PrivacyUpdate,
    ProfileResponse,
    ProfileUpdate,
    PublicProfileResponse,
)
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


@router_profile.get('/me/privacy', response_model=PrivacyResponse)
async def get_my_privacy(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_profile.get_privacy(current_user.id, db)


@router_profile.patch('/me/privacy', response_model=PrivacyResponse)
async def update_my_privacy(
    data: PrivacyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_profile.update_privacy(current_user.id, data, db)


@router_profile.post('/languages', response_model=LanguageResponse)
async def add_my_language(
    data: LanguageAdd,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_profile.add_language(current_user.id, data, db)


@router_profile.get('/{user_id}', response_model=PublicProfileResponse, response_model_exclude_none=True)
async def get_public_profile(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    profile = await crud_profile.get_public_profile(user_id, current_user.id, db)

    if profile is None:
        raise AppError(code='USER_NOT_FOUND', message='User not found', status_code=404)

    return profile
