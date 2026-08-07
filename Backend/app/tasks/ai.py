import json
import logging

from sqlalchemy import select

from app.celery_app import celery_app
from app.core.task_loop import run_async
from app.db.database import AsyncSessionLocal
from app.models.model_content import GrammarLessons, GrammarQuestions
from app.services import llm_client

logger = logging.getLogger(__name__)

GENERATE_EXERCISE_PROMPT = """
You are a language teacher writing one fill-in-the-blank exercise for a CEFR {level}
learner on the topic "{topic}".

Requirements:
- The sentence must be something a person would actually say, in a realistic
  everyday situation — not a textbook specimen.
- Vocabulary must not exceed {level}. The exercise tests "{topic}", nothing else;
  do not make it hard for an unrelated reason.
- Exactly one blank, written as ___ .
- Provide 3-4 options. The distractors must be plausible — the specific forms a
  {level} learner really confuses, not obviously silly words.
- "explanation_en" must teach the rule in one or two warm sentences, so a learner
  who got it wrong understands WHY rather than just seeing the right answer.
  Never use the words wrong, incorrect, mistake or error.

Reply with a single JSON object and nothing else, in exactly this shape:
{{"text_en": "sentence with ___ in it",
  "options": ["option1", "option2", "option3"],
  "answer": "the correct option, exactly as written in options",
  "explanation_en": "warm explanation that teaches the rule"}}
"""


async def _get_or_create_lesson(topic: str, level: str, db):
    result = await db.execute(
        select(GrammarLessons).where(GrammarLessons.topic == topic, GrammarLessons.cefr_level == level)
    )
    lesson = result.scalar_one_or_none()

    if lesson is not None:
        return lesson

    lesson = GrammarLessons(cefr_level=level, lesson=topic, topic=topic)
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


async def _generate_exercise(topic: str, level: str):
    async with AsyncSessionLocal() as db:
        lesson = await _get_or_create_lesson(topic, level, db)

        prompt = GENERATE_EXERCISE_PROMPT.format(level=level, topic=topic)
        raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
        data = json.loads(raw)

        question = GrammarQuestions(
            lesson_id=lesson.id,
            type='fill_blank',
            text_en=data.get('text_en'),
            options=data.get('options'),
            answer=data.get('answer', ''),
            explanation_en=data.get('explanation_en'),
        )
        db.add(question)
        await db.commit()
        await db.refresh(question)
        return question.id


@celery_app.task(name='app.tasks.ai.generate_exercise')
def generate_exercise_task(topic: str, level: str):
    return run_async(_generate_exercise(topic, level))


@celery_app.task(name='app.tasks.ai.process_event')
def process_ai_event(**kwargs):
    if kwargs.get('action') == 'generate_exercise':
        return generate_exercise_task(kwargs['topic'], kwargs['level'])

    return kwargs


GENERATE_STORY_DICTIONARY_PROMPT = (
    'Extract all unique English words from the following text. '
    'For each word, determine its base dictionary form (lemma) based on the context, '
    'and translate the lemma into Russian and Tajik. '
    'If a word appears in a form whose base form is ambiguous, choose the lemma that '
    'fits THIS text\'s meaning (e.g. "left" as past of "leave", not the direction). '
    'Skip proper names, numbers and words shorter than 3 letters. '
    'Respond ONLY with a single JSON object where keys are the lowercase original words from the text, '
    'and values are objects with keys "lemma", "ru", and "tg". '
    'Example: {{"apples": {{"lemma": "apple", "ru": "яблоко", "tg": "себ"}}, '
    '"went": {{"lemma": "go", "ru": "идти", "tg": "рафтан"}}}}. '
    'Ensure you return a valid JSON object. No markdown formatting or backticks around the json. '
    'Text:\n{text}'
)

WORDS_PER_DICTIONARY_CHUNK = 1500


def _chunk_words(text: str, words_per_chunk: int = WORDS_PER_DICTIONARY_CHUNK):
    words = text.split()

    for i in range(0, len(words), words_per_chunk):
        yield ' '.join(words[i:i + words_per_chunk])


def _strip_code_fence(raw: str):
    raw = raw.strip()

    if raw.startswith('```json'):
        raw = raw[len('```json'):]
    elif raw.startswith('```'):
        raw = raw[len('```'):]

    if raw.endswith('```'):
        raw = raw[:-len('```')]

    return raw.strip()


async def _generate_story_dictionary(story_id: int, story_type: str = 'system'):
    from app.models.model_content import Stories
    from app.models.model_user_story import UserStories

    # story_type distingue две независимые таблицы с одинаковым по смыслу полем
    # word_dictionary — system 'stories' (тексты платформы) и 'user_stories' (истории
    # авторов из Author Studio). Раньше эта задача всегда лезла в Stories по id,
    # который мог принадлежать user_stories — совпадение id тихо портило чужую
    # системную историю, а несовпадение просто оставляло словарь пустым навсегда.
    model = Stories if story_type == 'system' else UserStories
    text_field = 'body_en' if story_type == 'system' else 'body'

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(model).where(model.id == story_id))
        story = result.scalar_one_or_none()

        if not story:
            return False

        # Длинная история в одном запросе легко упирается в лимит вывода модели и обрывает
        # JSON на середине — режем на куски, склеиваем словари; при сбое любого куска не
        # сохраняем частично собранный словарь (лучше пусто, чем тихо неполно).
        dictionary_data = {}

        for chunk in _chunk_words(getattr(story, text_field)):
            prompt = GENERATE_STORY_DICTIONARY_PROMPT.format(text=chunk)

            try:
                raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
                dictionary_data.update(json.loads(_strip_code_fence(raw)))
            except Exception:
                logger.exception('Failed to generate word dictionary chunk for story %s', story_id)
                return False

        story.word_dictionary = dictionary_data
        db.add(story)
        await db.commit()
        return True


@celery_app.task(name='app.tasks.ai.generate_story_dictionary')
def generate_story_dictionary_task(story_id: int, story_type: str = 'system'):
    return run_async(_generate_story_dictionary(story_id, story_type))
