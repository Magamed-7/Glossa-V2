import datetime as dt

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import ReadingProgress, Stories, StoryListens, StoryQuestions, StoryWords
from app.schemas.schema_learning import CardCreate
from app.services import crud_card, ratings, streaks, transcription, word_audio
from app.services.localization import pick_locale


PASS_THRESHOLD = 0.75


def story_to_response(story: Stories):
    return {
        'id': story.id,
        'title': story.title_en,
        'cefr_level': story.cefr_level,
        'genre': story.genre,
        'grammar_topic': story.grammar_topic,
        'image_url': story.image_url,
        'audio_url': story.audio_url,
        'accent': story.accent,
    }


def story_translation(story: Stories, locale: str, field_prefix: str):
    if locale == 'ru':
        return getattr(story, f'{field_prefix}_ru')
    if locale == 'tg':
        return getattr(story, f'{field_prefix}_tg')
    return None


async def get_stories(db: AsyncSession, level=None, genre=None, topic=None, limit=20, offset=0, levels=None):
    query = select(Stories)

    # `levels` is the set the learner has unlocked; `level` narrows that down to one
    # when they pick a filter in the UI.
    if levels:
        query = query.where(Stories.cefr_level.in_(levels))
    if level:
        query = query.where(Stories.cefr_level == level)
    if genre:
        query = query.where(Stories.genre == genre)
    if topic:
        query = query.where(Stories.grammar_topic == topic)

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
    transcriptions = await transcription.get_many([w.word for w in words], db)

    audio = await word_audio.get_many_cached([w.word for w in words], story.cefr_level, db)
    missing_audio = [w.word for w in words if w.word.strip().lower() not in audio]
    if missing_audio:
        from app.tasks.ai import generate_word_audio_batch_task
        generate_word_audio_batch_task.delay(missing_audio, story.cefr_level)

    return {
        **story_to_response(story),
        'body': story.body_en,
        'title_translated': story_translation(story, locale, 'title'),
        'body_translated': story_translation(story, locale, 'body'),
        'word_dictionary': story.word_dictionary,
        'words': [
            {
                'id': w.id,
                'word': w.word,
                'translation_ru': w.translation_ru,
                'translation_tg': w.translation_tg,
                'part_of_speech': w.part_of_speech,
                'context': w.context,
                'transcription': transcriptions.get(w.word.strip().lower()),
                'audio_url': audio.get(w.word.strip().lower(), {}).get('audio_url'),
                'accent': audio.get(w.word.strip().lower(), {}).get('accent'),
            }
            for w in words
        ],
        'questions': [
            {'id': q.id, 'text': pick_locale(q, 'text', locale), 'options': q.options}
            for q in questions
        ],
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


async def record_listen(user_id: int, story_id: int, db: AsyncSession):
    stmt = pg_insert(StoryListens).values(user_id=user_id, story_id=story_id, listened_on=dt.date.today())
    stmt = stmt.on_conflict_do_nothing(index_elements=['user_id', 'story_id', 'listened_on'])
    await db.execute(stmt)
    await db.commit()


async def add_story_word_to_deck(word_id: int, user_id: int, locale: str, db: AsyncSession):
    word = await get_story_word(word_id, db)

    if word is None:
        return None

    translation = word.translation_tg if locale == 'tg' else word.translation_ru
    word_transcription = await transcription.get_one(word.word, db)

    story = await get_story(word.story_id, db)
    level = story.cefr_level if story else 'A1'
    audio = await word_audio.get_one(word.word, level, db)

    data = CardCreate(word=word.word, translation=translation, example=word.context, transcription=word_transcription)
    card = await crud_card.create_card(data, user_id, db, source_story_id=word.story_id)

    if audio is not None:
        card = await crud_card.update_audio(card.id, user_id, audio['audio_url'], db, accent=audio['accent'])

    return card


async def submit_story_questions(story_id: int, user_id: int, answers, locale: str, db: AsyncSession):
    questions = await get_story_questions(story_id, db)
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

        results.append({
            'question_id': question.id,
            'is_correct': is_correct,
            'correct_answer': question.answer,
            'explanation': pick_locale(question, 'explanation', locale),
        })

    total = len(answers)
    completed = total > 0 and (correct / total) >= PASS_THRESHOLD

    if completed:
        progress = await get_reading_progress(user_id, story_id, db)
        was_completed = False

        if progress is None:
            progress = ReadingProgress(user_id=user_id, story_id=story_id)
            db.add(progress)
        else:
            was_completed = progress.is_completed

        progress.is_completed = True
        await db.commit()

        await streaks.touch_streak(user_id, db)

        if not was_completed:
            await ratings.award_xp(user_id, 'review_passed', db)

    return {
        'total': total,
        'correct': correct,
        'completed': completed,
        'results': results,
    }
