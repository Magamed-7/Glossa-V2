from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_content import StoryDetailResponse, StoryResponse
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
