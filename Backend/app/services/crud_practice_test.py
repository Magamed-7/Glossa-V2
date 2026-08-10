from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_content import Stories
from app.models.model_course import PracticeTestAttempt
from app.services import crud_course, crud_story, test_compose
from app.services.localization import pick_locale


async def get_eligible_levels(user_id: int, db: AsyncSession):
    progress = await crud_course.get_progress_summary(user_id, db)
    current_level = progress['current_level']

    if current_level not in crud_course.LEVEL_ORDER:
        return current_level, list(crud_course.LEVEL_ORDER)

    boundary = crud_course.LEVEL_ORDER.index(current_level) + 1
    return current_level, crud_course.LEVEL_ORDER[:boundary]


async def generate_custom_test(user_id: int, cefr_levels: list[str], categories: list[str], size: str, locale: str, db: AsyncSession):
    _, eligible_levels = await get_eligible_levels(user_id, db)
    invalid_levels = [level for level in cefr_levels if level not in eligible_levels]
    if invalid_levels:
        raise AppError(code='LEVEL_NOT_UNLOCKED', message='Selected level is not unlocked yet', status_code=403)

    target_size = test_compose.PRACTICE_TEST_SIZES[size]
    items = await test_compose.compose_practice_test(cefr_levels, categories, target_size, db, locale=locale)

    category = 'combined' if len(categories) > 1 else categories[0]
    attempt = PracticeTestAttempt(
        user_id=user_id, category=category, cefr_levels=cefr_levels, questions_snapshot=items, status='ready'
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt


async def generate_story_test(user_id: int, story_id: int, locale: str, db: AsyncSession):
    story = await crud_story.get_story(story_id, db)
    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    progress = await crud_story.get_reading_progress(user_id, story_id, db)
    if progress is None or not progress.is_completed:
        raise AppError(code='STORY_NOT_READ', message='Read the story before taking its test', status_code=403)

    items = await test_compose.compose_story_practice_test(story_id, db, locale=locale)
    if not items:
        raise AppError(code='STORY_HAS_NO_QUESTIONS', message='This story has no test questions yet', status_code=400)

    attempt = PracticeTestAttempt(
        user_id=user_id, category='story', cefr_levels=[story.cefr_level], story_id=story_id,
        questions_snapshot=items, status='ready',
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt, pick_locale(story, 'title', locale)


async def submit_practice_test(user_id: int, attempt_id: int, answers: dict, db: AsyncSession):
    attempt = (
        await db.execute(
            select(PracticeTestAttempt).where(
                PracticeTestAttempt.id == attempt_id, PracticeTestAttempt.user_id == user_id
            )
        )
    ).scalar_one_or_none()

    if attempt is None:
        return None

    outcome = test_compose.grade(attempt.questions_snapshot, answers)
    attempt.answers = answers
    attempt.score_percent = outcome['score_percent']
    attempt.status = 'completed'
    attempt.completed_at = datetime.now(timezone.utc)
    await db.commit()

    return outcome


async def list_story_tests(user_id: int, db: AsyncSession, level: str | None = None, locale: str = 'en'):
    query = select(Stories).order_by(Stories.id)
    if level:
        query = query.where(Stories.cefr_level == level)

    stories = (await db.execute(query)).scalars().all()
    story_ids = [story.id for story in stories]

    progress_rows = await crud_story.get_my_reading_progress(user_id, db)
    read_map = {row.story_id: row.is_completed for row in progress_rows}

    attempts_by_story = {}
    if story_ids:
        attempts_result = await db.execute(
            select(PracticeTestAttempt).where(
                PracticeTestAttempt.user_id == user_id,
                PracticeTestAttempt.category == 'story',
                PracticeTestAttempt.story_id.in_(story_ids),
                PracticeTestAttempt.status == 'completed',
            )
        )
        for attempt in attempts_result.scalars().all():
            attempts_by_story.setdefault(attempt.story_id, []).append(attempt.score_percent)

    result = []
    for story in stories:
        scores = attempts_by_story.get(story.id, [])
        result.append({
            'story_id': story.id,
            'title': pick_locale(story, 'title', locale),
            'cefr_level': story.cefr_level,
            'is_read': bool(read_map.get(story.id)),
            'attempts': len(scores),
            'best_score_percent': max(scores) if scores else None,
        })

    return result


async def get_analytics(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(PracticeTestAttempt).where(
            PracticeTestAttempt.user_id == user_id, PracticeTestAttempt.status == 'completed'
        )
    )
    attempts = result.scalars().all()

    if not attempts:
        return {'total_attempts': 0, 'average_score_percent': 0, 'pass_rate': 0, 'by_category': [], 'by_level': []}

    total_attempts = len(attempts)
    average_score_percent = sum(a.score_percent for a in attempts) / total_attempts
    passed = sum(1 for a in attempts if a.score_percent >= test_compose.PASS_THRESHOLD * 100)
    pass_rate = passed / total_attempts * 100

    by_category_scores = {}
    for attempt in attempts:
        by_category_scores.setdefault(attempt.category, []).append(attempt.score_percent)

    by_category = [
        {'category': category, 'attempts': len(scores), 'average_score_percent': round(sum(scores) / len(scores), 1)}
        for category, scores in by_category_scores.items()
    ]

    by_level_scores = {}
    for attempt in attempts:
        for level in attempt.cefr_levels:
            by_level_scores.setdefault(level, []).append(attempt.score_percent)

    by_level = [
        {'cefr_level': level, 'attempts': len(scores), 'average_score_percent': round(sum(scores) / len(scores), 1)}
        for level, scores in by_level_scores.items()
    ]
    by_level.sort(key=lambda row: crud_course.LEVEL_ORDER.index(row['cefr_level']) if row['cefr_level'] in crud_course.LEVEL_ORDER else 99)

    return {
        'total_attempts': total_attempts,
        'average_score_percent': round(average_score_percent, 1),
        'pass_rate': round(pass_rate, 1),
        'by_category': by_category,
        'by_level': by_level,
    }


async def list_history(user_id: int, db: AsyncSession, limit: int = 20, offset: int = 0):
    result = await db.execute(
        select(PracticeTestAttempt)
        .where(PracticeTestAttempt.user_id == user_id, PracticeTestAttempt.status == 'completed')
        .order_by(PracticeTestAttempt.completed_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
