from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_content import (
    ReadingProgressResponse,
    ReadingProgressUpdate,
    StoryDetailResponse,
    StoryResponse,
)
from app.schemas.schema_learning import CardResponse
from app.services import crud_story

router_stories = APIRouter(prefix='/stories', tags=['Stories'])


@router_stories.get('/', response_model=list[StoryResponse])
async def get_stories(
    level: str | None = None,
    genre: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    stories = await crud_story.get_stories(db, level=level, genre=genre, limit=limit, offset=offset)
    return [crud_story.story_to_response(story) for story in stories]


@router_stories.get('/my-progress', response_model=list[ReadingProgressResponse])
async def get_my_progress(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_story.get_my_reading_progress(current_user.id, db)


@router_stories.get('/{story_id}', response_model=StoryDetailResponse)
async def get_story(
    story_id: int,
    locale: str = 'en',
    db: AsyncSession = Depends(get_db),
):
    detail = await crud_story.get_story_detail(story_id, locale, db)

    if detail is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    return detail


@router_stories.post('/{story_id}/progress', response_model=ReadingProgressResponse)
async def update_story_progress(
    story_id: int,
    data: ReadingProgressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_story.upsert_reading_progress(current_user.id, story_id, data, db)


@router_stories.post('/{story_id}/words/{word_id}/add-to-deck', response_model=CardResponse)
async def add_story_word_to_deck(
    story_id: int,
    word_id: int,
    locale: str = 'ru',
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await crud_story.add_story_word_to_deck(word_id, current_user.id, locale, db)

    if card is None:
        raise AppError(code='STORY_WORD_NOT_FOUND', message='Story word not found', status_code=404)

    return card
