from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_course import TestSubmitResponse
from app.schemas.schema_practice import (
    PracticeAnalyticsResponse,
    PracticeEligibleLevelsResponse,
    PracticeHistoryItem,
    PracticeTestGenerateRequest,
    PracticeTestGenerateResponse,
    PracticeTestSubmitRequest,
    StoryPracticeSummary,
    StoryTestGenerateResponse,
)
from app.services import crud_practice_test, test_compose

router_practice = APIRouter(prefix='/practice-tests', tags=['Practice Tests'])


@router_practice.get('/levels', response_model=PracticeEligibleLevelsResponse)
async def get_eligible_levels(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    current_level, eligible_levels = await crud_practice_test.get_eligible_levels(current_user.id, db)
    return {'current_level': current_level, 'eligible_levels': eligible_levels}


@router_practice.get('/analytics', response_model=PracticeAnalyticsResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_practice_test.get_analytics(current_user.id, db)


@router_practice.get('/history', response_model=list[PracticeHistoryItem])
async def get_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_practice_test.list_history(current_user.id, db, limit=limit, offset=offset)


@router_practice.get('/stories', response_model=list[StoryPracticeSummary])
async def get_story_tests(
    level: str | None = None,
    locale: str = 'en',
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_practice_test.list_story_tests(current_user.id, db, level=level, locale=locale)


@router_practice.post('/stories/{story_id}/generate', response_model=StoryTestGenerateResponse)
async def generate_story_test(
    story_id: int,
    locale: str = 'en',
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    attempt, title = await crud_practice_test.generate_story_test(current_user.id, story_id, locale, db)
    return {
        'attempt_id': attempt.id,
        'story_id': story_id,
        'cefr_level': attempt.cefr_levels[0],
        'title': title,
        'questions': test_compose.strip_answers(attempt.questions_snapshot),
    }


@router_practice.post('/custom/generate', response_model=PracticeTestGenerateResponse)
async def generate_custom_test(
    data: PracticeTestGenerateRequest,
    locale: str = 'en',
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    attempt = await crud_practice_test.generate_custom_test(
        current_user.id, data.cefr_levels, data.categories, data.size, locale, db
    )
    return {
        'attempt_id': attempt.id,
        'category': attempt.category,
        'cefr_levels': attempt.cefr_levels,
        'questions': test_compose.strip_answers(attempt.questions_snapshot),
    }


@router_practice.post('/{attempt_id}/submit', response_model=TestSubmitResponse)
async def submit_practice_test(
    attempt_id: int,
    data: PracticeTestSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    outcome = await crud_practice_test.submit_practice_test(current_user.id, attempt_id, data.answers, db)
    if outcome is None:
        raise AppError(code='TEST_ATTEMPT_NOT_FOUND', message='Test attempt not found', status_code=404)

    return outcome
