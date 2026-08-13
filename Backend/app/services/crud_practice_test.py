from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_card import Cards
from app.models.model_content import GrammarAttempts, GrammarLessons, GrammarQuestions, ReadingProgress, Stories, VocabEntries
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


async def _assert_owned_by_levels(db: AsyncSession, model, ids: list[int], eligible_levels: list[str], error_code: str, error_message: str):
    if not ids:
        return

    unique_ids = set(ids)
    count = (
        await db.execute(
            select(func.count()).select_from(model).where(model.id.in_(unique_ids), model.cefr_level.in_(eligible_levels))
        )
    ).scalar_one()

    if count != len(unique_ids):
        raise AppError(code=error_code, message=error_message, status_code=403)


async def _assert_stories_read(db: AsyncSession, user_id: int, story_ids: list[int]):
    if not story_ids:
        return

    unique_ids = set(story_ids)
    count = (
        await db.execute(
            select(func.count()).select_from(ReadingProgress).where(
                ReadingProgress.user_id == user_id,
                ReadingProgress.story_id.in_(unique_ids),
                ReadingProgress.is_completed.is_(True),
            )
        )
    ).scalar_one()

    if count != len(unique_ids):
        raise AppError(code='STORY_NOT_READ', message='Read the story before including it in a test', status_code=403)


async def generate_custom_test(
    user_id: int, cefr_levels: list[str], categories: list[str], size: str, locale: str, db: AsyncSession,
    grammar_lesson_ids: list[int] | None = None, vocab_entry_ids: list[int] | None = None, story_ids: list[int] | None = None,
):
    _, eligible_levels = await get_eligible_levels(user_id, db)
    invalid_levels = [level for level in cefr_levels if level not in eligible_levels]
    if invalid_levels:
        raise AppError(code='LEVEL_NOT_UNLOCKED', message='Selected level is not unlocked yet', status_code=403)

    await _assert_owned_by_levels(
        db, GrammarLessons, grammar_lesson_ids or [], eligible_levels,
        'LEVEL_NOT_UNLOCKED', 'Selected grammar topic is above your unlocked level',
    )
    await _assert_owned_by_levels(
        db, VocabEntries, vocab_entry_ids or [], eligible_levels,
        'LEVEL_NOT_UNLOCKED', 'Selected word is above your unlocked level',
    )
    await _assert_owned_by_levels(
        db, Stories, story_ids or [], eligible_levels,
        'LEVEL_NOT_UNLOCKED', 'Selected story is above your unlocked level',
    )
    await _assert_stories_read(db, user_id, story_ids or [])

    target_size = test_compose.PRACTICE_TEST_SIZES[size]
    items = await test_compose.compose_practice_test(
        cefr_levels, categories, target_size, db, locale=locale,
        grammar_lesson_ids=grammar_lesson_ids, vocab_entry_ids=vocab_entry_ids, story_ids=story_ids,
    )

    category = 'combined' if len(categories) > 1 else categories[0]
    attempt = PracticeTestAttempt(
        user_id=user_id, category=category, cefr_levels=cefr_levels, questions_snapshot=items, status='ready'
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt


async def get_learned_ids(user_id: int, db: AsyncSession):
    _, eligible_levels = await get_eligible_levels(user_id, db)

    grammar_result = await db.execute(
        select(GrammarLessons.id)
        .join(GrammarQuestions, GrammarQuestions.lesson_id == GrammarLessons.id)
        .join(GrammarAttempts, GrammarAttempts.question_id == GrammarQuestions.id)
        .where(GrammarAttempts.user_id == user_id, GrammarLessons.cefr_level.in_(eligible_levels))
        .distinct()
    )
    grammar_lesson_ids = [row[0] for row in grammar_result.all()]

    deck_words = (
        await db.execute(select(func.lower(Cards.word)).where(Cards.user_id == user_id))
    ).scalars().all()
    deck_word_set = set(deck_words)

    vocab_result = await db.execute(
        select(VocabEntries.id, VocabEntries.word).where(VocabEntries.cefr_level.in_(eligible_levels))
    )
    vocab_entry_ids = [row[0] for row in vocab_result.all() if row[1].lower() in deck_word_set]

    story_result = await db.execute(
        select(Stories.id)
        .join(ReadingProgress, ReadingProgress.story_id == Stories.id)
        .where(
            ReadingProgress.user_id == user_id, ReadingProgress.is_completed.is_(True),
            Stories.cefr_level.in_(eligible_levels),
        )
    )
    story_ids = [row[0] for row in story_result.all()]

    return {
        'grammar_lesson_ids': grammar_lesson_ids,
        'vocab_entry_ids': vocab_entry_ids,
        'story_ids': story_ids,
    }


async def generate_story_test(user_id: int, story_id: int, locale: str, db: AsyncSession):
    story = await crud_story.get_story(story_id, db)
    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Story not found', status_code=404)

    _, eligible_levels = await get_eligible_levels(user_id, db)
    if story.cefr_level not in eligible_levels:
        raise AppError(code='LEVEL_NOT_UNLOCKED', message='This story is above your unlocked level', status_code=403)

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

    # Award XP for practice test completion (15 XP base, +5 passing, +10 high score)
    from app.services import ratings
    practice_xp = 15
    if outcome['score_percent'] >= 90:
        practice_xp += 10
    elif outcome['score_percent'] >= 60:
        practice_xp += 5
    await ratings.award_xp(user_id, 'review_passed', db, amount=practice_xp)

    return outcome


async def list_story_tests(user_id: int, db: AsyncSession, level: str | None = None, locale: str = 'en'):
    _, eligible_levels = await get_eligible_levels(user_id, db)
    if level:
        allowed_levels = [level] if level in eligible_levels else []
    else:
        allowed_levels = eligible_levels

    query = select(Stories).where(Stories.cefr_level.in_(allowed_levels)).order_by(Stories.id)
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
            'genre': story.genre,
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
