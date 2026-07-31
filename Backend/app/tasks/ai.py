import json

from sqlalchemy import select

from app.celery_app import celery_app
from app.core.task_loop import run_async
from app.db.database import AsyncSessionLocal
from app.models.model_content import GrammarLessons, GrammarQuestions
from app.services import llm_client

GENERATE_EXERCISE_PROMPT = (
    'Generate one fill-in-the-blank grammar exercise for CEFR level {level} '
    'about the topic "{topic}". Respond with a single JSON object, no other text, '
    'in exactly this shape: {{"text_en": "sentence with a blank", '
    '"options": ["choice1", "choice2"] or null, "answer": "the correct answer", '
    '"explanation_en": "short explanation"}}.'
)


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
