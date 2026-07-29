from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import GrammarExamples, GrammarLessons, GrammarQuestions, VocabEntries
from app.services.localization import pick_locale


def vocab_translation(entry: VocabEntries, locale: str):
    if locale == 'ru':
        return entry.translation_ru
    if locale == 'tg':
        return entry.translation_tg
    return None


def vocab_to_response(entry: VocabEntries, locale: str):
    return {
        'id': entry.id,
        'word': entry.word,
        'part_of_speech': entry.part_of_speech,
        'example_en': entry.example_en,
        'translation': vocab_translation(entry, locale),
        'cefr_level': entry.cefr_level,
        'unit': entry.unit,
    }


async def get_vocab_entries(db: AsyncSession, level=None, unit=None, search=None, limit=20, offset=0):
    query = select(VocabEntries)

    if level:
        query = query.where(VocabEntries.cefr_level == level)
    if unit:
        query = query.where(VocabEntries.unit == unit)
    if search:
        query = query.where(VocabEntries.word.ilike(f'%{search}%'))

    query = query.order_by(VocabEntries.word).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


async def get_vocab_entry(entry_id: int, db: AsyncSession):
    result = await db.execute(select(VocabEntries).where(VocabEntries.id == entry_id))
    return result.scalar_one_or_none()


def lesson_to_response(lesson: GrammarLessons):
    return {
        'id': lesson.id,
        'cefr_level': lesson.cefr_level,
        'unit': lesson.unit,
        'lesson': lesson.lesson,
        'topic': lesson.topic,
        'structure': lesson.structure,
        'tip': lesson.tip,
    }


def question_to_response(question: GrammarQuestions, locale: str):
    return {
        'id': question.id,
        'type': question.type,
        'text': pick_locale(question, 'text', locale),
        'options': question.options,
        'answer': question.answer,
    }


def question_to_result_response(question: GrammarQuestions, locale: str):
    return {
        **question_to_response(question, locale),
        'explanation': pick_locale(question, 'explanation', locale),
    }


async def get_grammar_lessons(db: AsyncSession, level=None, unit=None, limit=20, offset=0):
    query = select(GrammarLessons)

    if level:
        query = query.where(GrammarLessons.cefr_level == level)
    if unit:
        query = query.where(GrammarLessons.unit == unit)

    query = query.order_by(GrammarLessons.cefr_level, GrammarLessons.lesson).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


async def get_grammar_lesson(lesson_id: int, db: AsyncSession):
    result = await db.execute(select(GrammarLessons).where(GrammarLessons.id == lesson_id))
    return result.scalar_one_or_none()


async def get_lesson_examples(lesson_id: int, db: AsyncSession):
    result = await db.execute(
        select(GrammarExamples).where(GrammarExamples.lesson_id == lesson_id).order_by(GrammarExamples.order)
    )
    return result.scalars().all()


async def get_lesson_questions(lesson_id: int, db: AsyncSession):
    result = await db.execute(select(GrammarQuestions).where(GrammarQuestions.lesson_id == lesson_id))
    return result.scalars().all()


async def get_lesson_detail(lesson_id: int, locale: str, db: AsyncSession):
    lesson = await get_grammar_lesson(lesson_id, db)

    if lesson is None:
        return None

    examples = await get_lesson_examples(lesson_id, db)
    questions = await get_lesson_questions(lesson_id, db)

    return {
        **lesson_to_response(lesson),
        'rule': pick_locale(lesson, 'rule', locale),
        'examples': [{'id': e.id, 'text': e.text, 'order': e.order} for e in examples],
        'questions': [question_to_response(q, locale) for q in questions],
    }
