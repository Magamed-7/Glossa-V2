import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import GrammarLessons
from app.services import llm_client

CONCURRENCY = 4
ATTEMPTS = 3

PROMPT = """You are writing an engaging grammar article for a language-learning app,
for a CEFR {level} learner studying English. The specific grammar point is:

Topic: {topic}
Short rule (already shown elsewhere, don't just repeat it verbatim): {rule_en}
Structure/formula (already shown separately): {structure}
Existing quick tip (already shown separately): {tip}

Write a warm, genuinely interesting explanatory article about this exact grammar
point — several short paragraphs, not a bullet list. Cover: what the rule actually
is and why the language works this way (the logic behind it, not just "this is the
rule"), 3-4 varied natural example sentences woven into the prose (not a list),
the most common mistake learners make with this specific point and why it happens,
and how this connects to something the learner likely already knows. Write for a
{level} learner: match vocabulary and sentence complexity to that level. Keep it
to roughly 150-280 words. Do not use headings or markdown formatting, just prose
paragraphs separated by blank lines.

Write the SAME article content three times, once in each language below (not a
translation word-for-word, but the same explanation naturally written in each
language, adjusted for what reads naturally in that language):
- English (explanation_long_en)
- Russian (explanation_long_ru)
- Tajik, Cyrillic script (explanation_long_tg)

Respond with a single JSON object and nothing else, in exactly this shape:
{{"explanation_long_en": "...", "explanation_long_ru": "...", "explanation_long_tg": "..."}}
"""


def _strip_code_fence(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith('```json'):
        raw = raw[len('```json'):]
    elif raw.startswith('```'):
        raw = raw[len('```'):]
    if raw.endswith('```'):
        raw = raw[:-len('```')]
    return raw.strip()


async def _expand_one(lesson_id: int, stats: dict):
    async with AsyncSessionLocal() as db:
        lesson = (await db.execute(select(GrammarLessons).where(GrammarLessons.id == lesson_id))).scalar_one()

        if lesson.explanation_long_en and lesson.explanation_long_ru and lesson.explanation_long_tg:
            stats['skipped'] += 1
            return

        prompt = PROMPT.format(
            level=lesson.cefr_level,
            topic=lesson.topic,
            rule_en=lesson.rule_en or lesson.topic,
            structure=lesson.structure or '(none given)',
            tip=lesson.tip_en or '(none given)',
        )

        for attempt in range(ATTEMPTS):
            try:
                raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
                data = json.loads(_strip_code_fence(raw))
                if not all(data.get(k) for k in ('explanation_long_en', 'explanation_long_ru', 'explanation_long_tg')):
                    raise ValueError('missing keys')
            except Exception as exc:
                print(f'  lesson {lesson_id} attempt {attempt + 1} failed: {exc}')
                continue

            lesson.explanation_long_en = data['explanation_long_en']
            lesson.explanation_long_ru = data['explanation_long_ru']
            lesson.explanation_long_tg = data['explanation_long_tg']
            await db.commit()
            stats['done'] += 1
            print(f'  lesson {lesson_id} ({lesson.cefr_level} — {lesson.topic}) done')
            return

        stats['failed'] += 1
        print(f'  lesson {lesson_id} FAILED after {ATTEMPTS} attempts')


async def main():
    async with AsyncSessionLocal() as db:
        ids = [row[0] for row in (await db.execute(select(GrammarLessons.id))).all()]

    print(f'{len(ids)} lessons to process')
    stats = {'done': 0, 'skipped': 0, 'failed': 0}
    semaphore = asyncio.Semaphore(CONCURRENCY)

    async def bound(lesson_id):
        async with semaphore:
            await _expand_one(lesson_id, stats)

    await asyncio.gather(*[bound(lesson_id) for lesson_id in ids])
    print(f"done={stats['done']} skipped={stats['skipped']} failed={stats['failed']}")


if __name__ == '__main__':
    asyncio.run(main())
