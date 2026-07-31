from sqlalchemy import select

from app.models.model_content import GrammarAttempts, GrammarLessons, GrammarQuestions
from app.services import crud_content
from mcp_server.db import AsyncSessionLocal
from mcp_server.instance import mcp

EXERCISE_TEMPLATES = {
    'fill_blank': {'text_en': '', 'options': None, 'answer': '', 'explanation_en': ''},
    'choice': {'text_en': '', 'options': [], 'answer': '', 'explanation_en': ''},
}


@mcp.tool()
async def get_exercises(user_id: int, topic: str) -> list[dict]:
    """Return grammar exercises for a topic that the user has not already answered correctly."""
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(GrammarQuestions)
            .join(GrammarLessons, GrammarLessons.id == GrammarQuestions.lesson_id)
            .where(GrammarLessons.topic == topic)
        )
        questions = result.scalars().all()

        solved_result = await db.execute(
            select(GrammarAttempts.question_id).where(
                GrammarAttempts.user_id == user_id, GrammarAttempts.is_correct.is_(True)
            )
        )
        solved_ids = set(solved_result.scalars().all())

        return [
            crud_content.question_to_response(question, 'en')
            for question in questions
            if question.id not in solved_ids
        ]


@mcp.tool()
def generate_exercise_template(topic: str, level: str) -> dict:
    """Return an empty exercise template shape for a topic/level, to be filled in by exercise generation."""
    return {
        'topic': topic,
        'level': level,
        'type': 'fill_blank',
        'template': EXERCISE_TEMPLATES['fill_blank'],
    }
