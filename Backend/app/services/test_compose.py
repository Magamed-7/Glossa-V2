import random

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import GrammarLessons, GrammarQuestions, Stories, StoryQuestions, VocabEntries
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

PRACTICE_TEST_SIZES = {'short': 10, 'medium': 20, 'long': 30}
PRACTICE_CATEGORY_WEIGHTS = {'grammar': 3, 'vocab': 2, 'reading': 2}


def grammar_question_to_item(question: GrammarQuestions, locale: str):
    return {
        'id': f'gq-{question.id}',
        'kind': 'grammar',
        'text': pick_locale(question, 'text', locale),
        'options': question.options,
        'answer': question.answer,
        'explanation': pick_locale(question, 'explanation', locale),
    }


def reading_question_to_item(question: StoryQuestions, locale: str):
    return {
        'id': f'sq-{question.id}',
        'kind': 'reading',
        'text': pick_locale(question, 'text', locale),
        'options': question.options,
        'answer': question.answer,
        'story_id': question.story_id,
        'explanation': pick_locale(question, 'explanation', locale),
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


async def _grammar_pool_for_levels(db: AsyncSession, cefr_levels: list[str]):
    result = await db.execute(
        select(GrammarQuestions)
        .join(GrammarLessons, GrammarQuestions.lesson_id == GrammarLessons.id)
        .where(GrammarLessons.cefr_level.in_(cefr_levels))
    )
    return result.scalars().all()


async def _vocab_pool_for_levels(db: AsyncSession, cefr_levels: list[str]):
    result = await db.execute(select(VocabEntries).where(VocabEntries.cefr_level.in_(cefr_levels)))
    return result.scalars().all()


async def _vocab_entries_by_ids(db: AsyncSession, entry_ids: list[int]):
    result = await db.execute(select(VocabEntries).where(VocabEntries.id.in_(entry_ids)))
    return result.scalars().all()


async def _reading_pool_for_story(db: AsyncSession, story_id: int):
    result = await db.execute(select(StoryQuestions).where(StoryQuestions.story_id == story_id))
    return result.scalars().all()


async def _reading_pool_for_stories(db: AsyncSession, story_ids: list[int]):
    result = await db.execute(select(StoryQuestions).where(StoryQuestions.story_id.in_(story_ids)))
    return result.scalars().all()


async def _reading_pool_for_levels(db: AsyncSession, cefr_levels: list[str]):
    result = await db.execute(
        select(StoryQuestions)
        .join(Stories, StoryQuestions.story_id == Stories.id)
        .where(Stories.cefr_level.in_(cefr_levels))
    )
    return result.scalars().all()


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


def _allocate_category_targets(categories: list[str], size: int):
    total_weight = sum(PRACTICE_CATEGORY_WEIGHTS[c] for c in categories)
    targets = {}
    allocated = 0

    for index, category in enumerate(categories):
        if index == len(categories) - 1:
            targets[category] = size - allocated
        else:
            share = round(size * PRACTICE_CATEGORY_WEIGHTS[category] / total_weight)
            targets[category] = share
            allocated += share

    return targets


async def compose_practice_test(
    cefr_levels: list[str], categories: list[str], size: int, db: AsyncSession, locale: str = 'en',
    seed: str | None = None, grammar_lesson_ids: list[int] | None = None, vocab_entry_ids: list[int] | None = None,
    story_ids: list[int] | None = None,
):
    seed_key = f"practice:{'-'.join(sorted(cefr_levels))}:{'-'.join(sorted(categories))}:{size}"
    rng = _seeded_rng(seed or seed_key)
    targets = _allocate_category_targets(categories, size)

    items = []
    grammar_pool = []

    if 'grammar' in categories:
        grammar_pool = (
            await _grammar_pool(db, grammar_lesson_ids) if grammar_lesson_ids
            else await _grammar_pool_for_levels(db, cefr_levels)
        )
        rng.shuffle(grammar_pool)
        items += [grammar_question_to_item(q, locale) for q in grammar_pool[:targets['grammar']]]

    if 'vocab' in categories:
        vocab_pool = await _vocab_pool_for_levels(db, cefr_levels)
        vocab_entries = await _vocab_entries_by_ids(db, vocab_entry_ids) if vocab_entry_ids else vocab_pool
        items += build_vocab_questions(vocab_entries, vocab_pool, locale, rng, targets['vocab'])

    if 'reading' in categories:
        reading_pool = (
            await _reading_pool_for_stories(db, story_ids) if story_ids
            else await _reading_pool_for_levels(db, cefr_levels)
        )
        rng.shuffle(reading_pool)
        items += [reading_question_to_item(q, locale) for q in reading_pool[:targets['reading']]]

    if grammar_pool and len(items) < size:
        items = _fill_with_grammar(items, grammar_pool, size, locale, rng)

    rng.shuffle(items)
    return items


async def compose_story_practice_test(story_id: int, db: AsyncSession, locale: str = 'en', seed: str | None = None):
    rng = _seeded_rng(seed or f'practice:story:{story_id}')
    pool = await _reading_pool_for_story(db, story_id)
    items = [reading_question_to_item(q, locale) for q in pool]
    rng.shuffle(items)
    return items


def strip_answers(items: list[dict]):
    hidden = {'answer', 'explanation'}
    return [{k: v for k, v in item.items() if k not in hidden} for item in items]


def grade(items: list[dict], answers: dict):
    total = len(items)
    correct = 0
    results = []

    for item in items:
        given = answers.get(item['id'])
        is_correct = given is not None and str(given).strip().lower() == str(item['answer']).strip().lower()
        if is_correct:
            correct += 1

        results.append({
            'id': item['id'],
            'text': item['text'],
            'options': item.get('options'),
            'answer': item['answer'],
            'given': given,
            'is_correct': is_correct,
            'explanation': item.get('explanation'),
        })

    score_percent = (correct / total * 100) if total else 0
    passed = total > 0 and (correct / total) >= PASS_THRESHOLD

    return {
        'total': total,
        'correct': correct,
        'score_percent': round(score_percent, 1),
        'passed': passed,
        'results': results,
    }
