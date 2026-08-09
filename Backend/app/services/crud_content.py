from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import (
    GrammarAttempts,
    GrammarExamples,
    GrammarLessons,
    GrammarQuestions,
    VocabEntries,
)
from app.services import ratings
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


async def get_vocab_entries(db: AsyncSession, level=None, unit=None, search=None, ids=None, limit=20, offset=0):
    query = select(VocabEntries)

    if level:
        query = query.where(VocabEntries.cefr_level == level)
    if unit:
        query = query.where(VocabEntries.unit == unit)
    if search:
        query = query.where(VocabEntries.word.ilike(f'%{search}%'))
    if ids:
        query = query.where(VocabEntries.id.in_(ids))

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


def question_to_result_response(question: GrammarQuestions, locale: str, is_correct: bool):
    return {
        **question_to_response(question, locale),
        'explanation': pick_locale(question, 'explanation', locale),
        'is_correct': is_correct,
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


async def submit_grammar_answers(lesson_id: int, user_id: int, answers, locale: str, db: AsyncSession):
    questions = await get_lesson_questions(lesson_id, db)
    questions_by_id = {q.id: q for q in questions}

    correct = 0
    results = []

    for answer in answers:
        question = questions_by_id.get(answer.question_id)

        if question is None:
            continue

        is_correct = answer.answer.strip().lower() == question.answer.strip().lower()

        if is_correct:
            correct += 1

        db.add(GrammarAttempts(user_id=user_id, question_id=question.id, is_correct=is_correct))
        results.append(question_to_result_response(question, locale, is_correct))

    await db.commit()

    for _ in range(correct):
        await ratings.award_xp(user_id, 'review_passed', db)

    return {
        'total': len(answers),
        'correct': correct,
        'results': results,
    }


async def get_weak_topics(user_id: int, db: AsyncSession):
    query = (
        select(GrammarLessons.topic, GrammarAttempts.is_correct)
        .select_from(GrammarAttempts)
        .join(GrammarQuestions, GrammarQuestions.id == GrammarAttempts.question_id)
        .join(GrammarLessons, GrammarLessons.id == GrammarQuestions.lesson_id)
        .where(GrammarAttempts.user_id == user_id)
    )

    rows = (await db.execute(query)).all()

    stats_by_topic = {}

    for topic, is_correct in rows:
        stats = stats_by_topic.setdefault(topic, {'attempts': 0, 'incorrect': 0})
        stats['attempts'] += 1
        if not is_correct:
            stats['incorrect'] += 1

    topics = []

    for topic, stats in stats_by_topic.items():
        error_rate = stats['incorrect'] / stats['attempts'] * 100
        topics.append({
            'topic': topic,
            'attempts': stats['attempts'],
            'incorrect': stats['incorrect'],
            'error_rate': round(error_rate, 2),
        })

    topics.sort(key=lambda t: t['error_rate'], reverse=True)
    return topics


async def get_grammar_progress(user_id: int, db: AsyncSession):
    """Return how many distinct lessons the user has completed (submitted at least once)."""
    # Get all lesson IDs that the user has attempted at least one question for
    from sqlalchemy import distinct, func as sqlfunc
    # Count all lessons per level
    all_lessons_q = select(GrammarLessons.cefr_level, sqlfunc.count(GrammarLessons.id).label('total')).\
        group_by(GrammarLessons.cefr_level)
    all_rows = (await db.execute(all_lessons_q)).all()
    totals_by_level = {row.cefr_level: row.total for row in all_rows}
    total_all = sum(totals_by_level.values())

    # Count lessons with at least one attempt by this user
    attempted_q = (
        select(GrammarLessons.cefr_level, sqlfunc.count(distinct(GrammarLessons.id)).label('done'))
        .select_from(GrammarAttempts)
        .join(GrammarQuestions, GrammarQuestions.id == GrammarAttempts.question_id)
        .join(GrammarLessons, GrammarLessons.id == GrammarQuestions.lesson_id)
        .where(GrammarAttempts.user_id == user_id)
        .group_by(GrammarLessons.cefr_level)
    )
    done_rows = (await db.execute(attempted_q)).all()
    done_by_level = {row.cefr_level: row.done for row in done_rows}
    done_all = sum(done_by_level.values())

    by_level = []
    for level in ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']:
        total = totals_by_level.get(level, 0)
        done = done_by_level.get(level, 0)
        pct = round((done / total) * 100, 1) if total > 0 else 0.0
        by_level.append({
            'level': level,
            'total_lessons': total,
            'completed_lessons': done,
            'percent': pct,
        })

    return {
        'total_lessons': total_all,
        'completed_lessons': done_all,
        'percent': round((done_all / total_all) * 100, 1) if total_all > 0 else 0.0,
        'by_level': by_level,
    }

