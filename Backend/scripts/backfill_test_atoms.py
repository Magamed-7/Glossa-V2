import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
import app.models.model_user  # noqa: F401 - registers users for FK resolution
import app.models.model_content  # noqa: F401 - registers grammar_lessons/stories for FK resolution
from app.models.model_course import AtomCompletion, CourseUnit, CourseUnitStories, CourseUnitVocab


async def main():
    async with AsyncSessionLocal() as db:
        units = (await db.execute(select(CourseUnit))).scalars().all()

        units_with_vocab = set(
            row[0] for row in (await db.execute(select(CourseUnitVocab.course_unit_id.distinct()))).all()
        )
        units_with_stories = set(
            row[0] for row in (await db.execute(select(CourseUnitStories.course_unit_id.distinct()))).all()
        )

        prior_required_by_unit = {}
        for unit in units:
            required = {'grammar'}
            if unit.id in units_with_vocab:
                required.add('vocabulary')
            if unit.id in units_with_stories:
                required.add('story')
            prior_required_by_unit[unit.id] = required

        users = (await db.execute(select(AtomCompletion.user_id).distinct())).scalars().all()
        units_by_id = {unit.id: unit for unit in units}

        granted = 0
        skipped = 0

        for user_id in users:
            rows = (
                await db.execute(
                    select(AtomCompletion.course_unit_id, AtomCompletion.atom_type).where(
                        AtomCompletion.user_id == user_id
                    )
                )
            ).all()

            completed_by_unit = {}
            for unit_id, atom_type in rows:
                completed_by_unit.setdefault(unit_id, set()).add(atom_type)

            for unit_id, completed in completed_by_unit.items():
                unit = units_by_id.get(unit_id)
                if unit is None:
                    continue

                if not prior_required_by_unit[unit_id] <= completed:
                    continue

                atom_types = ('unit_test', 'level_test') if (unit.is_level_midpoint or unit.is_level_final) else ('unit_test',)
                for atom_type in atom_types:
                    if atom_type in completed:
                        skipped += 1
                        continue

                    db.add(AtomCompletion(
                        user_id=user_id,
                        course_unit_id=unit_id,
                        atom_type=atom_type,
                        time_spent_seconds=0,
                    ))
                    granted += 1

        await db.commit()
        print(f'granted {granted} grandfathered test completions, skipped {skipped} already present')


asyncio.run(main())
