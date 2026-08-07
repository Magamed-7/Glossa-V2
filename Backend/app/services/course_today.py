from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_course import CourseUnit
from app.services import crud_course, review

ATOM_MINUTES = {'vocabulary': 8, 'grammar': 12, 'story': 10}


async def _next_unit(current: CourseUnit, db: AsyncSession):
    return (
        await db.execute(
            select(CourseUnit)
            .where(CourseUnit.sequence_index > current.sequence_index)
            .order_by(CourseUnit.sequence_index)
            .limit(1)
        )
    ).scalar_one_or_none()


async def get_today_queue(user_id: int, db: AsyncSession):
    progress = await crud_course.get_or_create_progress(user_id, db)
    budget = progress.daily_minutes_budget or 30
    remaining = budget
    queue = []
    heavy_review_day = False

    due_cards = await review.get_due_cards(user_id, db)
    if due_cards:
        review_minutes = min(max(len(due_cards) // 3, 3), budget)
        queue.append({
            'kind': 'review',
            'estimated_minutes': review_minutes,
            'due_card_count': len(due_cards),
        })
        remaining -= review_minutes
        if remaining <= 0:
            heavy_review_day = True
            remaining = 0

    current_unit = None
    if progress.current_unit_id:
        current_unit = await crud_course.get_unit(progress.current_unit_id, db)
    if current_unit is None:
        current_unit = await crud_course.get_first_incomplete_unit(user_id, db)

    suggested_test = None
    suggested_test_level = None

    if current_unit is not None:
        detail = await crud_course.get_unit_detail(user_id, current_unit.id, db)
        completed = set(detail['completed_atoms'])

        atom_candidates = ['vocabulary', 'grammar', 'story']
        for atom_type in atom_candidates:
            if atom_type == 'vocabulary' and not detail['vocab_entry_ids']:
                continue
            if atom_type == 'story' and not detail['story_ids']:
                continue
            if atom_type in completed:
                continue

            estimated = ATOM_MINUTES[atom_type]
            if queue and remaining - estimated < 0:
                break

            queue.append({
                'kind': atom_type,
                'course_unit_id': current_unit.id,
                'unit_code': current_unit.unit_code,
                'theme_title': current_unit.theme_title,
                'estimated_minutes': estimated,
                'grammar_lesson_id': detail['grammar_lesson_id'] if atom_type == 'grammar' else None,
                'story_ids': detail['story_ids'] if atom_type == 'story' else None,
                'vocab_entry_ids': detail['vocab_entry_ids'] if atom_type == 'vocabulary' else None,
            })
            remaining -= estimated

        if detail['status'] == 'completed':
            if remaining > 10:
                next_unit = await _next_unit(current_unit, db)
                if next_unit is not None:
                    queue.append({
                        'kind': 'next_unit_preview',
                        'course_unit_id': next_unit.id,
                        'unit_code': next_unit.unit_code,
                        'theme_title': next_unit.theme_title,
                        'estimated_minutes': next_unit.estimated_minutes,
                    })

            if current_unit.is_level_midpoint:
                suggested_test = 'midpoint'
                suggested_test_level = current_unit.cefr_level
            elif current_unit.is_level_final:
                suggested_test = 'final'
                suggested_test_level = current_unit.cefr_level

    used_minutes = max(budget - max(remaining, 0), 0)

    return {
        'budget_minutes': budget,
        'used_minutes': used_minutes,
        'queue': queue,
        'heavy_review_day': heavy_review_day,
        'suggested_test': suggested_test,
        'suggested_test_level': suggested_test_level,
    }
