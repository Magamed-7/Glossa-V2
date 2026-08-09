import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import GrammarQuestions, Stories, StoryQuestions, VocabEntries
from app.models.model_course import CourseUnit, CourseUnitVocab
from app.services.localization import pick_locale
from app.services.vocab_questions import build_vocab_questions, get_level_vocab_pool


PASS_THRESHOLD = 0.75

LEVEL_TEST_BLUEPRINTS = {
    'midpoint': {'grammar': 14, 'vocab': 4, 'reading': 2},
    'final': {'grammar': 18, 'vocab': 6, 'reading': 4},
    'placement': {'grammar': 18, 'vocab': 6, 'reading': 4},
}

UNIT_TEST_BLUEPRINT = {'grammar': 5, 'vocab': 3}


def grammar_question_to_item(question: GrammarQuestions, locale: str):
    return {
        'id': f'gq-{question.id}',
        'kind': 'grammar',
        'text': pick_locale(question, 'text', locale),
        'options': question.options,
        'answer': question.answer,
    }


def reading_question_to_item(question: StoryQuestions, locale: str):
    return {
        'id': f'sq-{question.id}',
        'kind': 'reading',
        'text': pick_locale(question, 'text', locale),
        'options': question.options,
        'answer': question.answer,
        'story_id': question.story_id,
    }


def _seeded_rng(seed: str):
    return random.Random(seed)


async def _grammar_pool(db: AsyncSession, lesson_ids: list[int]):
    if not lesson_ids:
        return []
    result = await db.execute(select(GrammarQuestions).where(GrammarQuestions.lesson_id.in_(lesson_ids)))
    return result.scalars().all()


async def _reading_pool(db: AsyncSession, cefr_level: str):
    result = await db.execute(
        select(StoryQuestions)
        .join(Stories, StoryQuestions.story_id == Stories.id)
        .where(Stories.cefr_level == cefr_level)
    )
    return result.scalars().all()


async def _unit_vocab_entries(db: AsyncSession, unit_id: int):
    result = await db.execute(
        select(CourseUnitVocab.vocab_entry_id).where(CourseUnitVocab.course_unit_id == unit_id)
    )
    ids = [row[0] for row in result.all()]

    if not ids:
        return []

    entries = await db.execute(select(VocabEntries).where(VocabEntries.id.in_(ids)))
    return entries.scalars().all()


async def _lessons_for_level(db: AsyncSession, cefr_level: str, up_to_sequence_index: int | None = None):
    query = select(CourseUnit.grammar_lesson_id).where(
        CourseUnit.cefr_level == cefr_level, CourseUnit.grammar_lesson_id.is_not(None)
    )
    if up_to_sequence_index is not None:
        query = query.where(CourseUnit.sequence_index <= up_to_sequence_index)

    result = await db.execute(query)
    return [row[0] for row in result.all()]


def _fill_with_grammar(items: list, grammar_pool: list[GrammarQuestions], target_total: int, locale: str, rng: random.Random):
    used_ids = {item['id'] for item in items}
    remaining = [q for q in grammar_pool if f'gq-{q.id}' not in used_ids]
    rng.shuffle(remaining)

    for question in remaining:
        if len(items) >= target_total:
            break
        items.append(grammar_question_to_item(question, locale))

    return items


async def compose_unit_test(unit: CourseUnit, db: AsyncSession, locale: str = 'en', seed: str | None = None):
    rng = _seeded_rng(seed or f'unit:{unit.id}')

    grammar_pool = await _grammar_pool(db, [unit.grammar_lesson_id] if unit.grammar_lesson_id else [])
    rng.shuffle(grammar_pool)
    grammar_items = [
        grammar_question_to_item(q, locale) for q in grammar_pool[:UNIT_TEST_BLUEPRINT['grammar']]
    ]

    vocab_entries = await _unit_vocab_entries(db, unit.id)
    level_pool = await get_level_vocab_pool(unit.cefr_level, db)
    vocab_items = build_vocab_questions(vocab_entries, level_pool, locale, rng, UNIT_TEST_BLUEPRINT['vocab'])

    items = grammar_items + vocab_items
    if not items:
        return items

    items = _fill_with_grammar(items, grammar_pool, min(len(grammar_pool), sum(UNIT_TEST_BLUEPRINT.values())), locale, rng)
    rng.shuffle(items)
    return items


async def compose_level_test(cefr_level: str, test_type: str, db: AsyncSession, locale: str = 'en', seed: str | None = None):
    blueprint = LEVEL_TEST_BLUEPRINTS[test_type]
    rng = _seeded_rng(seed or f'{cefr_level}:{test_type}')

    up_to = None
    if test_type == 'midpoint':
        midpoint_unit = (
            await db.execute(
                select(CourseUnit).where(CourseUnit.cefr_level == cefr_level, CourseUnit.is_level_midpoint.is_(True))
            )
        ).scalar_one_or_none()
        up_to = midpoint_unit.sequence_index if midpoint_unit else None

    lesson_ids = await _lessons_for_level(db, cefr_level, up_to)
    grammar_pool = await _grammar_pool(db, lesson_ids)
    rng.shuffle(grammar_pool)
    grammar_items = [grammar_question_to_item(q, locale) for q in grammar_pool[: blueprint['grammar']]]

    level_pool = await get_level_vocab_pool(cefr_level, db)
    vocab_items = build_vocab_questions(level_pool, level_pool, locale, rng, blueprint['vocab'])

    reading_pool = await _reading_pool(db, cefr_level)
    rng.shuffle(reading_pool)
    reading_items = [reading_question_to_item(q, locale) for q in reading_pool[: blueprint['reading']]]

    items = grammar_items + vocab_items + reading_items
    target_total = sum(blueprint.values())
    items = _fill_with_grammar(items, grammar_pool, target_total, locale, rng)
    rng.shuffle(items)
    return items


def strip_answers(items: list[dict]):
    return [{k: v for k, v in item.items() if k != 'answer'} for item in items]


def grade(items: list[dict], answers: dict):
    items_by_id = {item['id']: item for item in items}
    total = len(items)
    correct = 0

    for item in items:
        given = answers.get(item['id'])
        if given is not None and str(given).strip().lower() == str(item['answer']).strip().lower():
            correct += 1

    score_percent = (correct / total * 100) if total else 0
    passed = total > 0 and (correct / total) >= PASS_THRESHOLD

    return {
        'total': total,
        'correct': correct,
        'score_percent': round(score_percent, 1),
        'passed': passed,
    }
