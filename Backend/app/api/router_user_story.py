from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.api.permissions import require_writer_level
from app.core.errors import AppError
from app.core.limits import enforce_own_story_limit
from app.core.storage import upload_file
from app.db.database import get_db
from app.schemas.schema_user_story import UserStoryCreate, UserStoryResponse, UserStoryUpdate
from app.services import crud_user_story

router_user_story = APIRouter(prefix='/user-stories', tags=['User Stories'])


@router_user_story.post('', response_model=UserStoryResponse)
async def create_story(
    data: UserStoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_writer_level),
    _limit_ok=Depends(enforce_own_story_limit),
):
    return await crud_user_story.create_user_story(data, current_user.id, db)


@router_user_story.patch('/{story_id}', response_model=UserStoryResponse)
async def update_story(
    story_id: int,
    data: UserStoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = await crud_user_story.update_user_story(story_id, current_user.id, data, db)

    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    return story


@router_user_story.delete('/{story_id}', response_model=UserStoryResponse)
async def delete_story(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = await crud_user_story.delete_user_story(story_id, current_user.id, db)

    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    return story


@router_user_story.post('/{story_id}/publish', response_model=UserStoryResponse)
async def publish_story(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = await crud_user_story.publish_user_story(story_id, current_user.id, db)

    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    return story


@router_user_story.post('/{story_id}/cover', response_model=UserStoryResponse)
async def upload_story_cover(
    story_id: int,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    story = await crud_user_story.get_user_story(story_id, db)

    if story is None or story.author_id != current_user.id:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    file_bytes = await file.read()
    image_url = upload_file('story-images', file_bytes, file.filename, file.content_type)
    story.image_url = image_url

    await db.commit()
    await db.refresh(story)
    return story
