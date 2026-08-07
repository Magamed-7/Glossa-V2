from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_course import (
    AtomCompleteRequest,
    AtomCompletionResponse,
    CourseProgressResponse,
    CourseUnitDetail,
    CourseUnitSummary,
    LevelTestAvailability,
    LevelTestGenerateResponse,
    OnboardingRequest,
    OnboardingStatus,
    TodayQueueResponse,
)
from app.services import course_today, crud_course

router_course = APIRouter(prefix='/learning', tags=['Course'])


@router_course.get('/onboarding/status', response_model=OnboardingStatus)
async def get_onboarding_status(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_course.get_onboarding_status(current_user.id, db)


@router_course.post('/onboarding', response_model=OnboardingStatus)
async def submit_onboarding(
    data: OnboardingRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await crud_course.set_onboarding(current_user.id, data.daily_minutes_budget, data.days_per_week_target, db)
    return await crud_course.get_onboarding_status(current_user.id, db)


@router_course.get('/today', response_model=TodayQueueResponse)
async def get_today(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await course_today.get_today_queue(current_user.id, db)


@router_course.get('/units', response_model=list[CourseUnitSummary])
async def get_units(
    level: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_course.list_units(current_user.id, db, level=level)


@router_course.get('/units/{unit_id}', response_model=CourseUnitDetail)
async def get_unit_detail(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    detail = await crud_course.get_unit_detail(current_user.id, unit_id, db)
    if detail is None:
        raise AppError(code='COURSE_UNIT_NOT_FOUND', message='Course unit not found', status_code=404)
    return detail


@router_course.post('/units/{unit_id}/atoms/{atom_type}/complete', response_model=AtomCompletionResponse)
async def complete_unit_atom(
    unit_id: int,
    atom_type: str,
    data: AtomCompleteRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await crud_course.complete_atom(current_user.id, unit_id, atom_type, data.time_spent_seconds, db)
    if result is None:
        raise AppError(code='COURSE_UNIT_NOT_FOUND', message='Course unit not found', status_code=404)
    return result


@router_course.get('/progress', response_model=CourseProgressResponse)
async def get_progress(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_course.get_progress_summary(current_user.id, db)


@router_course.get('/tests/{level}/{test_type}', response_model=LevelTestAvailability)
async def get_test_availability(
    level: str,
    test_type: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if test_type not in ('midpoint', 'final'):
        raise AppError(code='INVALID_TEST_TYPE', message='test_type must be midpoint or final', status_code=400)

    available, reason = await crud_course.check_test_availability(current_user.id, level, test_type, db)
    return {'available': available, 'cefr_level': level, 'test_type': test_type, 'reason': reason}


@router_course.post('/tests/{level}/{test_type}/generate', response_model=LevelTestGenerateResponse)
async def generate_test(
    level: str,
    test_type: str,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if test_type not in ('midpoint', 'final'):
        raise AppError(code='INVALID_TEST_TYPE', message='test_type must be midpoint or final', status_code=400)

    available, reason = await crud_course.check_test_availability(current_user.id, level, test_type, db)
    if not available:
        raise AppError(code='TEST_NOT_AVAILABLE', message=reason or 'Test not available yet', status_code=400)

    attempt = await crud_course.create_test_attempt(current_user.id, level, test_type, db)
    return {'status': 'not_yet_generated', 'attempt_id': attempt.id}
