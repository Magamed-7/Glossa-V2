import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import GrammarExamples, GrammarLessons, GrammarQuestions


async def main():
    async with AsyncSessionLocal() as db:
        stubs = (
            await db.execute(
                select(GrammarLessons).where(GrammarLessons.source_key.like('seed:C2:grammar:missing:%'))
            )
        ).scalars().all()

        lesson_ids = [s.id for s in stubs]
        if not lesson_ids:
            print('no placeholder C2 grammar lessons found')
            return

        await db.execute(GrammarQuestions.__table__.delete().where(GrammarQuestions.lesson_id.in_(lesson_ids)))
        await db.execute(GrammarExamples.__table__.delete().where(GrammarExamples.lesson_id.in_(lesson_ids)))
        await db.execute(GrammarLessons.__table__.delete().where(GrammarLessons.id.in_(lesson_ids)))
        await db.commit()

        print(f'removed {len(lesson_ids)} placeholder C2 grammar lessons (unit="Mastery", generic '
              f'"Practice makes perfect" tip, 1 question/2 examples each, no CourseUnit referenced them) '
              f'and their examples/questions, replaced by the 18 real lessons in seed_c2_grammar.py')


asyncio.run(main())
