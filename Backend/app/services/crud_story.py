from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import ReadingProgress, Stories, StoryQuestions, StoryWords
from app.schemas.schema_learning import CardCreate
from app.services import crud_card, streaks


def story_to_response(story: Stories):
    return {
        'id': story.id,
        'title': story.title_en,
        'cefr_level': story.cefr_level,
        'genre': story.genre,
        'grammar_topic': story.grammar_topic,
        'image_url': story.image_url,
    }


def story_translation(story: Stories, locale: str, field_prefix: str):
    if locale == 'ru':
        return getattr(story, f'{field_prefix}_ru')
    if locale == 'tg':
        return getattr(story, f'{field_prefix}_tg')
    return None


async def get_stories(db: AsyncSession, level=None, genre=None, limit=20, offset=0):
    query = select(Stories)

    if level:
        query = query.where(Stories.cefr_level == level)
    if genre:
        query = query.where(Stories.genre == genre)

    query = query.order_by(Stories.id).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


async def get_story(story_id: int, db: AsyncSession):
    result = await db.execute(select(Stories).where(Stories.id == story_id))
    return result.scalar_one_or_none()


async def get_story_words(story_id: int, db: AsyncSession):
    result = await db.execute(select(StoryWords).where(StoryWords.story_id == story_id))
    return result.scalars().all()


async def get_story_word(word_id: int, db: AsyncSession):
    result = await db.execute(select(StoryWords).where(StoryWords.id == word_id))
    return result.scalar_one_or_none()


async def get_story_questions(story_id: int, db: AsyncSession):
    result = await db.execute(select(StoryQuestions).where(StoryQuestions.story_id == story_id))
    return result.scalars().all()


async def get_story_detail(story_id: int, locale: str, db: AsyncSession):
    story = await get_story(story_id, db)

    if story is None:
        return None

    words = await get_story_words(story_id, db)
    questions = await get_story_questions(story_id, db)

    return {
        **story_to_response(story),
        'body': story.body_en,
        'title_translated': story_translation(story, locale, 'title'),
        'body_translated': story_translation(story, locale, 'body'),
        'words': [
            {
                'id': w.id,
                'word': w.word,
                'translation_ru': w.translation_ru,
                'translation_tg': w.translation_tg,
                'part_of_speech': w.part_of_speech,
                'context': w.context,
            }
            for w in words
        ],
        'questions': [{'id': q.id, 'text': q.text, 'options': q.options} for q in questions],
    }


async def get_reading_progress(user_id: int, story_id: int, db: AsyncSession):
    result = await db.execute(
        select(ReadingProgress).where(
            ReadingProgress.user_id == user_id, ReadingProgress.story_id == story_id
        )
    )
    return result.scalar_one_or_none()


async def upsert_reading_progress(user_id: int, story_id: int, data, db: AsyncSession):
    progress = await get_reading_progress(user_id, story_id, db)

    if progress is None:
        progress = ReadingProgress(user_id=user_id, story_id=story_id)
        db.add(progress)

    if data.is_completed is not None:
        progress.is_completed = data.is_completed
    if data.last_position is not None:
        progress.last_position = data.last_position

    await db.commit()
    await db.refresh(progress)
    return progress


async def get_my_reading_progress(user_id: int, db: AsyncSession):
    result = await db.execute(select(ReadingProgress).where(ReadingProgress.user_id == user_id))
    return result.scalars().all()


async def add_story_word_to_deck(word_id: int, user_id: int, locale: str, db: AsyncSession):
    word = await get_story_word(word_id, db)

    if word is None:
        return None

    translation = word.translation_tg if locale == 'tg' else word.translation_ru

    data = CardCreate(word=word.word, translation=translation, example=word.context)
    return await crud_card.create_card(data, user_id, db, source_story_id=word.story_id)


async def submit_story_questions(story_id: int, user_id: int, answers, db: AsyncSession):
    questions = await get_story_questions(story_id, db)
    questions_by_id = {q.id: q for q in questions}

    correct = 0

    for answer in answers:
        question = questions_by_id.get(answer.question_id)

        if question is not None and answer.answer.strip().lower() == question.answer.strip().lower():
            correct += 1

    total = len(answers)
    completed = total > 0 and correct == total

    if completed:
        progress = await get_reading_progress(user_id, story_id, db)

        if progress is None:
            progress = ReadingProgress(user_id=user_id, story_id=story_id)
            db.add(progress)

        progress.is_completed = True
        await db.commit()

        await streaks.touch_streak(user_id, db)

    return {
        'total': total,
        'correct': correct,
        'completed': completed,
    }
