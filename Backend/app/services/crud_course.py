import math
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_course import (
    AtomCompletion,
    CourseUnit,
    CourseUnitStories,
    CourseUnitVocab,
    LevelTest,
    LevelTestAttempt,
    UnitTestAttempt,
    UserCourseProgress,
)
from app.services import ratings, test_compose

LEVEL_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']


async def get_or_create_progress(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserCourseProgress).where(UserCourseProgress.user_id == user_id))
    progress = result.scalar_one_or_none()

    if progress is not None:
        return progress

    progress = UserCourseProgress(user_id=user_id)
    db.add(progress)
    await db.commit()
    await db.refresh(progress)
    return progress


async def get_onboarding_status(user_id: int, db: AsyncSession):
    progress = await get_or_create_progress(user_id, db)
    return {
        'onboarded': progress.daily_minutes_budget is not None,
        'daily_minutes_budget': progress.daily_minutes_budget,
    }


async def set_onboarding(user_id: int, daily_minutes_budget: int, db: AsyncSession):
    progress = await get_or_create_progress(user_id, db)
    progress.daily_minutes_budget = daily_minutes_budget
    progress.days_per_week_target = 7
    await db.commit()
    await db.refresh(progress)
    return progress


async def _completed_atoms_by_unit(user_id: int, db: AsyncSession, unit_ids=None):
    query = select(AtomCompletion.course_unit_id, AtomCompletion.atom_type).where(
        AtomCompletion.user_id == user_id
    )
    if unit_ids is not None:
        query = query.where(AtomCompletion.course_unit_id.in_(unit_ids))

    rows = (await db.execute(query)).all()
    result = {}
    for unit_id, atom_type in rows:
        result.setdefault(unit_id, set()).add(atom_type)
    return result


async def _unit_story_vocab_ids(db: AsyncSession, unit_ids):
    story_rows = (
        await db.execute(select(CourseUnitStories.course_unit_id, CourseUnitStories.story_id).where(
            CourseUnitStories.course_unit_id.in_(unit_ids)
        ))
    ).all()
    vocab_rows = (
        await db.execute(select(CourseUnitVocab.course_unit_id, CourseUnitVocab.vocab_entry_id).where(
            CourseUnitVocab.course_unit_id.in_(unit_ids)
        ))
    ).all()

    stories_by_unit = {}
    for unit_id, story_id in story_rows:
        stories_by_unit.setdefault(unit_id, []).append(story_id)

    vocab_by_unit = {}
    for unit_id, vocab_id in vocab_rows:
        vocab_by_unit.setdefault(unit_id, []).append(vocab_id)

    return stories_by_unit, vocab_by_unit


def required_atoms(unit: CourseUnit, has_vocab: bool, has_stories: bool):
    atoms = ['grammar']
    if has_vocab:
        atoms.append('vocabulary')
    if has_stories:
        atoms.append('story')
    atoms.append('unit_test')
    if unit.is_level_midpoint or unit.is_level_final:
        atoms.append('level_test')
    return atoms


def compute_status(required, completed):
    completed = completed or set()
    if set(required) <= completed:
        return 'completed'
    if completed:
        return 'in_progress'
    return 'not_started'


async def get_unit(unit_id: int, db: AsyncSession):
    return (await db.execute(select(CourseUnit).where(CourseUnit.id == unit_id))).scalar_one_or_none()


def theme_title(unit: CourseUnit, locale: str):
    if locale == 'tg':
        return unit.theme_title_tg or unit.theme_title_ru
    if locale == 'en':
        return unit.theme_title_en or unit.theme_title_ru
    return unit.theme_title_ru


async def get_unlock_boundary(user_id: int, db: AsyncSession):
    progress = await get_or_create_progress(user_id, db)

    if progress.current_unit_id:
        unit = await get_unit(progress.current_unit_id, db)
        if unit is not None:
            return unit.sequence_index

    first_incomplete = await get_first_incomplete_unit(user_id, db)
    return first_incomplete.sequence_index if first_incomplete else 0


async def list_units(user_id: int, db: AsyncSession, level: str | None = None, locale: str = 'en'):
    query = select(CourseUnit).order_by(CourseUnit.sequence_index)
    if level:
        query = query.where(CourseUnit.cefr_level == level)

    units = (await db.execute(query)).scalars().all()
    unit_ids = [u.id for u in units]

    completed_map = await _completed_atoms_by_unit(user_id, db, unit_ids)
    stories_by_unit, vocab_by_unit = await _unit_story_vocab_ids(db, unit_ids)
    boundary = await get_unlock_boundary(user_id, db)

    result = []
    for unit in units:
        has_vocab = bool(vocab_by_unit.get(unit.id))
        has_stories = bool(stories_by_unit.get(unit.id))
        required = required_atoms(unit, has_vocab, has_stories)
        status = compute_status(required, completed_map.get(unit.id))

        result.append({
            'id': unit.id,
            'unit_code': unit.unit_code,
            'sequence_index': unit.sequence_index,
            'cefr_level': unit.cefr_level,
            'theme_title': theme_title(unit, locale),
            'grammar_topic_label': unit.grammar_topic_label,
            'grammar_lesson_id': unit.grammar_lesson_id,
            'estimated_minutes': unit.estimated_minutes,
            'is_level_midpoint': unit.is_level_midpoint,
            'is_level_final': unit.is_level_final,
            'status': status,
            'locked': unit.sequence_index > boundary,
        })

    return result


async def get_unit_detail(user_id: int, unit_id: int, db: AsyncSession, locale: str = 'en'):
    unit = await get_unit(unit_id, db)
    if unit is None:
        return None

    boundary = await get_unlock_boundary(user_id, db)

    if unit.sequence_index > boundary:
        return {
            'id': unit.id,
            'unit_code': unit.unit_code,
            'sequence_index': unit.sequence_index,
            'cefr_level': unit.cefr_level,
            'theme_title': theme_title(unit, locale),
            'locked': True,
        }

    completed_map = await _completed_atoms_by_unit(user_id, db, [unit_id])
    stories_by_unit, vocab_by_unit = await _unit_story_vocab_ids(db, [unit_id])

    story_ids = stories_by_unit.get(unit_id, [])
    vocab_ids = vocab_by_unit.get(unit_id, [])
    completed = completed_map.get(unit_id, set())
    required = required_atoms(unit, bool(vocab_ids), bool(story_ids))

    return {
        'id': unit.id,
        'unit_code': unit.unit_code,
        'sequence_index': unit.sequence_index,
        'cefr_level': unit.cefr_level,
        'theme_title': theme_title(unit, locale),
        'locked': False,
        'grammar_topic_label': unit.grammar_topic_label,
        'grammar_lesson_id': unit.grammar_lesson_id,
        'story_ids': story_ids,
        'vocab_entry_ids': vocab_ids,
        'estimated_minutes': unit.estimated_minutes,
        'is_level_midpoint': unit.is_level_midpoint,
        'is_level_final': unit.is_level_final,
        'completed_atoms': sorted(completed),
        'status': compute_status(required, completed),
    }


ATOM_XP_REASON = {
    'vocabulary': 'word_learned',
    'grammar': 'review_passed',
    'story': 'review_passed',
    'review': 'review_passed',
    'ai_practice': 'review_passed',
}


async def complete_atom(user_id: int, unit_id: int, atom_type: str, time_spent_seconds: int, db: AsyncSession):
    unit = await get_unit(unit_id, db)
    if unit is None:
        return None

    boundary = await get_unlock_boundary(user_id, db)
    if unit.sequence_index > boundary:
        return None

    existing = (
        await db.execute(
            select(AtomCompletion).where(
                AtomCompletion.user_id == user_id,
                AtomCompletion.course_unit_id == unit_id,
                AtomCompletion.atom_type == atom_type,
            )
        )
    ).scalar_one_or_none()

    if existing is not None:
        return existing

    completion = AtomCompletion(
        user_id=user_id,
        course_unit_id=unit_id,
        atom_type=atom_type,
        time_spent_seconds=time_spent_seconds,
    )
    db.add(completion)

    progress = await get_or_create_progress(user_id, db)
    progress.last_activity_at = datetime.now(timezone.utc)

    stories_by_unit, vocab_by_unit = await _unit_story_vocab_ids(db, [unit_id])
    completed_map = await _completed_atoms_by_unit(user_id, db, [unit_id])
    completed_map.setdefault(unit_id, set()).add(atom_type)
    required = required_atoms(unit, bool(vocab_by_unit.get(unit_id)), bool(stories_by_unit.get(unit_id)))

    if compute_status(required, completed_map[unit_id]) == 'completed':
        next_unit = (
            await db.execute(
                select(CourseUnit)
                .where(CourseUnit.sequence_index > unit.sequence_index)
                .order_by(CourseUnit.sequence_index)
                .limit(1)
            )
        ).scalar_one_or_none()
        progress.current_unit_id = next_unit.id if next_unit else unit.id
    elif progress.current_unit_id is None:
        progress.current_unit_id = unit.id

    await db.commit()
    await db.refresh(completion)

    await ratings.award_xp(user_id, ATOM_XP_REASON.get(atom_type, 'review_passed'), db)

    return {
        'id': completion.id,
        'course_unit_id': completion.course_unit_id,
        'atom_type': completion.atom_type,
        'completed_at': completion.completed_at,
        'time_spent_seconds': completion.time_spent_seconds,
        'current_unit_id': progress.current_unit_id,
    }


async def get_first_incomplete_unit(user_id: int, db: AsyncSession):
    all_units = (await db.execute(select(CourseUnit).order_by(CourseUnit.sequence_index))).scalars().all()
    if not all_units:
        return None

    unit_ids = [u.id for u in all_units]
    completed_map = await _completed_atoms_by_unit(user_id, db, unit_ids)
    stories_by_unit, vocab_by_unit = await _unit_story_vocab_ids(db, unit_ids)

    for unit in all_units:
        required = required_atoms(unit, bool(vocab_by_unit.get(unit.id)), bool(stories_by_unit.get(unit.id)))
        if compute_status(required, completed_map.get(unit.id)) != 'completed':
            return unit

    return all_units[-1]


async def get_progress_summary(user_id: int, db: AsyncSession):
    progress = await get_or_create_progress(user_id, db)

    all_units = (await db.execute(select(CourseUnit).order_by(CourseUnit.sequence_index))).scalars().all()
    unit_ids = [u.id for u in all_units]
    completed_map = await _completed_atoms_by_unit(user_id, db, unit_ids)
    stories_by_unit, vocab_by_unit = await _unit_story_vocab_ids(db, unit_ids)

    completed_units = 0
    level_stats = {}
    remaining_minutes = 0

    for unit in all_units:
        required = required_atoms(unit, bool(vocab_by_unit.get(unit.id)), bool(stories_by_unit.get(unit.id)))
        status = compute_status(required, completed_map.get(unit.id))
        stats = level_stats.setdefault(unit.cefr_level, {'cefr_level': unit.cefr_level, 'total': 0, 'completed': 0})
        stats['total'] += 1
        if status == 'completed':
            completed_units += 1
            stats['completed'] += 1
        else:
            remaining_minutes += unit.estimated_minutes

    current_unit = None
    if progress.current_unit_id:
        current_unit = next((u for u in all_units if u.id == progress.current_unit_id), None)
    if current_unit is None:
        current_unit = await get_first_incomplete_unit(user_id, db)

    projected_finish_date = None
    if progress.daily_minutes_budget and remaining_minutes > 0:
        minutes_per_week = progress.daily_minutes_budget * 7
        weeks_needed = math.ceil(remaining_minutes / minutes_per_week)
        projected_finish_date = date.today() + timedelta(weeks=weeks_needed)

    return {
        'total_units': len(all_units),
        'completed_units': completed_units,
        'current_level': current_unit.cefr_level if current_unit else None,
        'current_unit_id': current_unit.id if current_unit else None,
        'projected_finish_date': projected_finish_date,
        'daily_minutes_budget': progress.daily_minutes_budget,
        'level_breakdown': list(level_stats.values()),
    }


async def get_or_create_level_test(cefr_level: str, test_type: str, db: AsyncSession):
    result = await db.execute(
        select(LevelTest).where(LevelTest.cefr_level == cefr_level, LevelTest.test_type == test_type)
    )
    level_test = result.scalar_one_or_none()
    if level_test is not None:
        return level_test

    level_test = LevelTest(cefr_level=cefr_level, test_type=test_type)
    db.add(level_test)
    await db.commit()
    await db.refresh(level_test)
    return level_test


async def _flagged_unit_gate_ok(user_id: int, unit: CourseUnit, db: AsyncSession):
    stories_by_unit, vocab_by_unit = await _unit_story_vocab_ids(db, [unit.id])
    completed_map = await _completed_atoms_by_unit(user_id, db, [unit.id])
    required = required_atoms(unit, bool(vocab_by_unit.get(unit.id)), bool(stories_by_unit.get(unit.id)))
    prerequisite_atoms = [atom for atom in required if atom != 'level_test']
    return compute_status(prerequisite_atoms, completed_map.get(unit.id)) == 'completed'


async def check_test_availability(user_id: int, cefr_level: str, test_type: str, db: AsyncSession):
    if test_type == 'placement':
        progress = await get_or_create_progress(user_id, db)
        current_unit = await get_unit(progress.current_unit_id, db) if progress.current_unit_id else None
        if current_unit is None:
            current_unit = await get_first_incomplete_unit(user_id, db)
        if current_unit is None or current_unit.cefr_level != cefr_level:
            return False, 'not_current_level'
        if cefr_level not in LEVEL_ORDER or LEVEL_ORDER.index(cefr_level) == len(LEVEL_ORDER) - 1:
            return False, 'no_next_level'
        return True, None

    flag_field = CourseUnit.is_level_midpoint if test_type == 'midpoint' else CourseUnit.is_level_final
    unit = (
        await db.execute(select(CourseUnit).where(CourseUnit.cefr_level == cefr_level, flag_field == True))
    ).scalar_one_or_none()

    if unit is None:
        return False, 'level_has_no_flagged_unit'

    boundary = await get_unlock_boundary(user_id, db)
    if unit.sequence_index > boundary:
        return False, 'level_not_reached'

    if not await _flagged_unit_gate_ok(user_id, unit, db):
        return False, 'gating_unit_not_completed'

    return True, None


async def check_unit_test_availability(user_id: int, unit_id: int, db: AsyncSession):
    unit = await get_unit(unit_id, db)
    if unit is None:
        return False, 'unit_not_found'

    boundary = await get_unlock_boundary(user_id, db)
    if unit.sequence_index > boundary:
        return False, 'unit_locked'

    stories_by_unit, vocab_by_unit = await _unit_story_vocab_ids(db, [unit_id])
    completed_map = await _completed_atoms_by_unit(user_id, db, [unit_id])
    required = required_atoms(unit, bool(vocab_by_unit.get(unit_id)), bool(stories_by_unit.get(unit_id)))
    prerequisite_atoms = [atom for atom in required if atom != 'unit_test']

    if compute_status(prerequisite_atoms, completed_map.get(unit_id)) != 'completed':
        return False, 'unit_material_not_completed'

    return True, None


async def generate_unit_test(user_id: int, unit_id: int, locale: str, db: AsyncSession):
    unit = await get_unit(unit_id, db)
    if unit is None:
        return None

    items = await test_compose.compose_unit_test(unit, db, locale=locale)
    attempt = UnitTestAttempt(user_id=user_id, course_unit_id=unit_id, questions_snapshot=items, status='ready')
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt


async def submit_unit_test(user_id: int, unit_id: int, attempt_id: int, answers: dict, time_spent_seconds: int, db: AsyncSession):
    attempt = (
        await db.execute(
            select(UnitTestAttempt).where(
                UnitTestAttempt.id == attempt_id,
                UnitTestAttempt.user_id == user_id,
                UnitTestAttempt.course_unit_id == unit_id,
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

    if outcome['passed']:
        await complete_atom(user_id, unit_id, 'unit_test', time_spent_seconds, db)

    return outcome


async def generate_level_test(user_id: int, cefr_level: str, test_type: str, locale: str, db: AsyncSession):
    level_test = await get_or_create_level_test(cefr_level, test_type, db)
    items = await test_compose.compose_level_test(cefr_level, test_type, db, locale=locale)
    attempt = LevelTestAttempt(
        user_id=user_id, level_test_id=level_test.id, questions_snapshot=items, status='ready'
    )
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt


async def submit_level_test(user_id: int, cefr_level: str, test_type: str, attempt_id: int, answers: dict, time_spent_seconds: int, db: AsyncSession):
    attempt = (
        await db.execute(
            select(LevelTestAttempt).where(
                LevelTestAttempt.id == attempt_id, LevelTestAttempt.user_id == user_id
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

    if outcome['passed']:
        if test_type == 'placement':
            await _advance_to_next_level(user_id, cefr_level, db)
        else:
            flag_field = CourseUnit.is_level_midpoint if test_type == 'midpoint' else CourseUnit.is_level_final
            unit = (
                await db.execute(
                    select(CourseUnit).where(CourseUnit.cefr_level == cefr_level, flag_field == True)
                )
            ).scalar_one_or_none()
            if unit is not None:
                await complete_atom(user_id, unit.id, 'level_test', time_spent_seconds, db)

    return outcome


async def _advance_to_next_level(user_id: int, cefr_level: str, db: AsyncSession):
    if cefr_level not in LEVEL_ORDER:
        return

    next_index = LEVEL_ORDER.index(cefr_level) + 1
    if next_index >= len(LEVEL_ORDER):
        return

    next_level = LEVEL_ORDER[next_index]
    next_unit = (
        await db.execute(
            select(CourseUnit).where(CourseUnit.cefr_level == next_level).order_by(CourseUnit.sequence_index).limit(1)
        )
    ).scalar_one_or_none()

    if next_unit is None:
        return

    progress = await get_or_create_progress(user_id, db)
    progress.current_unit_id = next_unit.id
    progress.last_activity_at = datetime.now(timezone.utc)
    await db.commit()
