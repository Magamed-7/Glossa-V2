from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.limits import enforce_generated_story_limit, require_ai_access
from app.db.database import get_db
from app.schemas.schema_vocab_story import GenerateStoryRequest, GeneratedStoryResponse, GeneratedStorySummary
from app.services import vocab_story_gen

router_vocab_story = APIRouter(prefix='/vocabulary/generate-story', tags=['Vocabulary Story Generator'])


@router_vocab_story.post('', response_model=GeneratedStoryResponse)
async def generate_story(
    data: GenerateStoryRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(enforce_generated_story_limit),
):
    await require_ai_access(current_user=current_user, db=db)
    return await vocab_story_gen.generate(current_user.id, data.levels, data.word_status, data.approx_word_count, db)


@router_vocab_story.get('/history', response_model=list[GeneratedStorySummary])
async def get_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await vocab_story_gen.list_my_stories(current_user.id, db, limit=limit, offset=offset)


@router_vocab_story.get('/{story_id}', response_model=GeneratedStoryResponse)
async def get_story(
    story_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await vocab_story_gen.get_story(story_id, current_user.id, db)
