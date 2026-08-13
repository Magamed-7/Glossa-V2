from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.models.model_profile import UserLanguages
from app.core.errors import AppError
from app.core.limits import enforce_deck_word_limit, enforce_story_limit
from app.db.database import get_db
from app.schemas.schema_content import (
    ReadingProgressResponse,
    ReadingProgressUpdate,
    StoryDetailResponse,
    StoryListenResponse,
    StoryQuestionsResult,
    StoryQuestionsSubmit,
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
    current_user=Depends(get_current_user),
):
    result = await db.execute(
        select(UserLanguages).where(UserLanguages.user_id == current_user.id, UserLanguages.is_target.is_(True))
    )
    user_lang = result.scalar_one_or_none()
    user_level = user_lang.level if user_lang is not None else 'A1'
    if user_level == 'native':
        user_level = 'C2'

    stories = await crud_story.get_stories(db, level=user_level, genre=genre, limit=limit, offset=offset)
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
    current_user=Depends(enforce_story_limit),
):
    result = await db.execute(
        select(UserLanguages).where(UserLanguages.user_id == current_user.id, UserLanguages.is_target.is_(True))
    )
    user_lang = result.scalar_one_or_none()
    user_level = user_lang.level if user_lang is not None else 'A1'
    if user_level == 'native':
        user_level = 'C2'

    detail = await crud_story.get_story_detail(story_id, locale, db)

    if detail is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    if detail['cefr_level'] != user_level:
        raise AppError(
            code='STORY_LEVEL_LOCKED',
            message='This story is locked for your current level',
            status_code=403,
        )

    return detail


@router_stories.post('/{story_id}/listen', response_model=StoryListenResponse)
async def listen_to_story(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.core.limits import check_audiobook_limit

    story = await crud_story.get_story(story_id, db)

    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    if story.audio_url is None:
        raise AppError(code='STORY_AUDIO_NOT_AVAILABLE', message='Audio not available for this story yet', status_code=404)

    if not await check_audiobook_limit(current_user.id, story_id, db):
        raise AppError(code='AUDIOBOOK_LIMIT_REACHED', message='Daily audiobook limit reached, upgrade your plan', status_code=403)

    await crud_story.record_listen(current_user.id, story_id, db)
    return {'audio_url': story.audio_url, 'accent': story.accent}


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
    current_user=Depends(enforce_deck_word_limit),
):
    card = await crud_story.add_story_word_to_deck(word_id, current_user.id, locale, db)

    if card is None:
        raise AppError(code='STORY_WORD_NOT_FOUND', message='Story word not found', status_code=404)

    return card


@router_stories.post('/{story_id}/questions/submit', response_model=StoryQuestionsResult)
async def submit_story_questions(
    story_id: int,
    data: StoryQuestionsSubmit,
    locale: str = 'en',
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_story.submit_story_questions(story_id, current_user.id, data.answers, locale, db)
