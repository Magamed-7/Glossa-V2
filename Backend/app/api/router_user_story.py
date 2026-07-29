from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.api.permissions import require_writer_level
from app.core.errors import AppError
from app.core.limits import enforce_own_story_limit
from app.core.storage import upload_file
from app.db.database import get_db
from app.schemas.schema_user_story import (
    AuthorStatsResponse,
    ExerciseCreate,
    ExerciseResponse,
    ExerciseSubmit,
    ExerciseSubmitResult,
    ReviewCreate,
    ReviewResponse,
    UserStoryCreate,
    UserStoryDetailResponse,
    UserStoryResponse,
    UserStoryUpdate,
)
from app.services import crud_user_story

router_user_story = APIRouter(prefix='/user-stories', tags=['User Stories'])


@router_user_story.get('', response_model=list[UserStoryResponse])
async def get_stories(
    level: str | None = None,
    genre: str | None = None,
    is_free: bool | None = None,
    author_id: int | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    stories = await crud_user_story.get_user_stories(
        db, level=level, genre=genre, is_free=is_free, author_id=author_id, limit=limit, offset=offset
    )
    return stories


@router_user_story.post('', response_model=UserStoryResponse)
async def create_story(
    data: UserStoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_writer_level),
    _limit_ok=Depends(enforce_own_story_limit),
):
    return await crud_user_story.create_user_story(data, current_user.id, db)


@router_user_story.get('/my/stats', response_model=AuthorStatsResponse)
async def get_my_author_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_user_story.get_author_stats(current_user.id, db)


@router_user_story.get('/{story_id}', response_model=UserStoryDetailResponse, response_model_exclude_none=True)
async def get_story_detail(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    detail = await crud_user_story.get_user_story_detail(story_id, current_user.id, db)

    if detail is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    return detail


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


@router_user_story.post('/{story_id}/buy')
async def buy_story(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await crud_user_story.buy_story(story_id, current_user.id, db)
    return {'status': 'purchased'}


@router_user_story.post('/{story_id}/exercises', response_model=ExerciseResponse)
async def create_exercise(
    story_id: int,
    data: ExerciseCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_user_story.create_story_exercise(story_id, current_user.id, data, db)


@router_user_story.post('/{story_id}/exercises/submit', response_model=ExerciseSubmitResult)
async def submit_exercises(
    story_id: int,
    data: ExerciseSubmit,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_user_story.submit_story_exercises(story_id, current_user.id, data.answers, db)


@router_user_story.post('/{story_id}/reviews', response_model=ReviewResponse)
async def create_review(
    story_id: int,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_user_story.create_story_review(story_id, current_user.id, data, db)


@router_user_story.get('/{story_id}/reviews', response_model=list[ReviewResponse])
async def get_reviews(
    story_id: int,
    db: AsyncSession = Depends(get_db),
):
    return await crud_user_story.get_story_reviews(story_id, db)


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
