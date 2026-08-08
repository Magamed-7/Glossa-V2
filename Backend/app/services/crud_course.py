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
    UserCourseProgress,
)
from app.services import ratings


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


async def get_unlock_boundary(user_id: int, db: AsyncSession):
    progress = await get_or_create_progress(user_id, db)

    if progress.current_unit_id:
        unit = await get_unit(progress.current_unit_id, db)
        if unit is not None:
            return unit.sequence_index

    first_incomplete = await get_first_incomplete_unit(user_id, db)
    return first_incomplete.sequence_index if first_incomplete else 0


async def list_units(user_id: int, db: AsyncSession, level: str | None = None):
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
            'theme_title': unit.theme_title,
            'grammar_topic_label': unit.grammar_topic_label,
            'estimated_minutes': unit.estimated_minutes,
            'is_level_midpoint': unit.is_level_midpoint,
            'is_level_final': unit.is_level_final,
            'status': status,
            'locked': unit.sequence_index > boundary,
        })

    return result


async def get_unit_detail(user_id: int, unit_id: int, db: AsyncSession):
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
            'theme_title': unit.theme_title,
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
        'theme_title': unit.theme_title,
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


async def check_test_availability(user_id: int, cefr_level: str, test_type: str, db: AsyncSession):
    flag_field = CourseUnit.is_level_midpoint if test_type == 'midpoint' else CourseUnit.is_level_final
    unit = (
        await db.execute(select(CourseUnit).where(CourseUnit.cefr_level == cefr_level, flag_field == True))
    ).scalar_one_or_none()

    if unit is None:
        return False, 'level_has_no_flagged_unit'

    detail = await get_unit_detail(user_id, unit.id, db)
    if detail.get('status') != 'completed':
        return False, 'gating_unit_not_completed'

    return True, None


async def create_test_attempt(user_id: int, cefr_level: str, test_type: str, db: AsyncSession):
    level_test = await get_or_create_level_test(cefr_level, test_type, db)
    attempt = LevelTestAttempt(user_id=user_id, level_test_id=level_test.id, status='not_generated')
    db.add(attempt)
    await db.commit()
    await db.refresh(attempt)
    return attempt
