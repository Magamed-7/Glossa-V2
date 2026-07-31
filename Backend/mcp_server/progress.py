from sqlalchemy import select

from app.models.model_content import GrammarLessons
from app.services import crud_card, crud_content, crud_profile, crud_story, ratings, streaks
from mcp_server.db import AsyncSessionLocal
from mcp_server.instance import mcp


async def _get_target_language(user_id, db):
    languages = await crud_profile.get_user_languages(user_id, db)

    for language in languages:
        if language.is_target:
            return language

    return None


@mcp.tool()
async def get_progress(user_id: int) -> dict:
    """Return the user's target language, level, streak, XP, rank and card retention rate."""
    async with AsyncSessionLocal() as db:
        target_language = await _get_target_language(user_id, db)
        streak = await streaks.get_streak(user_id, db)
        rank = await ratings.get_my_rank(user_id, ratings.LEADERBOARD_GLOBAL_KEY)
        stats = await crud_card.get_learning_stats(user_id, db)

        return {
            'language': target_language.language if target_language else None,
            'level': target_language.level if target_language else None,
            'current_streak': streak.current_streak,
            'best_streak': streak.best_streak,
            'xp': rank['score'],
            'rank': rank['rank'],
            'retention_rate': stats['retention_rate'],
            'cards_total': stats['cards_total'],
            'due_today': stats['due_today'],
        }


@mcp.tool()
async def get_weak_topics(user_id: int) -> list[dict]:
    """Return the user's grammar topics ranked by error rate, worst first."""
    async with AsyncSessionLocal() as db:
        topics = await crud_content.get_weak_topics(user_id, db)
        return sorted(topics, key=lambda topic: topic['error_rate'], reverse=True)


@mcp.tool()
async def recommend_content(user_id: int) -> dict:
    """Recommend stories and grammar lessons matched to the user's level and weak topics."""
    async with AsyncSessionLocal() as db:
        target_language = await _get_target_language(user_id, db)
        level = target_language.level if target_language else 'A1'

        weak_topics = await crud_content.get_weak_topics(user_id, db)
        weak_topic_names = [
            topic['topic'] for topic in sorted(weak_topics, key=lambda t: t['error_rate'], reverse=True)[:3]
        ]

        stories = await crud_story.get_stories(db, level=level, limit=5)

        if weak_topic_names:
            result = await db.execute(
                select(GrammarLessons).where(GrammarLessons.topic.in_(weak_topic_names)).limit(5)
            )
            lessons = result.scalars().all()
        else:
            lessons = await crud_content.get_grammar_lessons(db, level=level, limit=5)

        return {
            'level': level,
            'weak_topics': weak_topic_names,
            'stories': [crud_story.story_to_response(story) for story in stories],
            'grammar_lessons': [crud_content.lesson_to_response(lesson) for lesson in lessons],
        }
