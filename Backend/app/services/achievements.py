from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_achievement import Achievements, UserAchievements, UserStreaks
from app.models.model_card import Cards, ReviewLogs
from app.models.model_user_story import StoryPurchases, StoryReviews, UserStories
from app.services import crud_social


async def get_metrics(user_id: int, db: AsyncSession):
    words_learned = await db.scalar(
        select(func.count()).select_from(Cards).where(Cards.user_id == user_id, Cards.status == 'learned')
    )

    reviews_done = await db.scalar(
        select(func.count()).select_from(ReviewLogs).join(Cards, Cards.id == ReviewLogs.card_id).where(
            Cards.user_id == user_id
        )
    )

    streak_result = await db.execute(select(UserStreaks).where(UserStreaks.user_id == user_id))
    streak = streak_result.scalar_one_or_none()

    friends = await crud_social.get_friends(user_id, db)

    stories_written = await db.scalar(
        select(func.count()).select_from(UserStories).where(
            UserStories.author_id == user_id, UserStories.status == 'published'
        )
    )

    stories_sold = await db.scalar(
        select(func.count()).select_from(StoryPurchases).join(
            UserStories, UserStories.id == StoryPurchases.story_id
        ).where(UserStories.author_id == user_id)
    )

    reviews_received = await db.scalar(
        select(func.count()).select_from(StoryReviews).join(
            UserStories, UserStories.id == StoryReviews.story_id
        ).where(UserStories.author_id == user_id)
    )

    return {
        'words': words_learned or 0,
        'streak': streak.current_streak if streak else 0,
        'friends': len(friends),
        'reviews': reviews_done or 0,
        'stories_written': stories_written or 0,
        'stories_sold': stories_sold or 0,
        'reviews_received': reviews_received or 0,
    }


async def check_achievements(user_id: int, db: AsyncSession):
    metrics = await get_metrics(user_id, db)

    all_achievements = (await db.execute(select(Achievements))).scalars().all()

    already_earned = (
        await db.execute(select(UserAchievements.achievement_id).where(UserAchievements.user_id == user_id))
    ).scalars().all()
    already_earned_ids = set(already_earned)

    newly_awarded = []

    for achievement in all_achievements:
        if achievement.id in already_earned_ids:
            continue

        metric_key = achievement.code.rsplit('_', 1)[0]
        value = metrics.get(metric_key, 0)

        if value >= achievement.threshold:
            award = UserAchievements(user_id=user_id, achievement_id=achievement.id)
            db.add(award)
            newly_awarded.append(achievement)

    if newly_awarded:
        await db.commit()

        # Trigger notifications and award XP for each newly earned achievement
        from app.services import notify_service, crud_settings, ratings
        for achievement in newly_awarded:
            await ratings.award_xp(user_id, 'social', db, amount=25)
            settings = await crud_settings.get_settings(user_id, db)
            locale = getattr(settings, 'interface_language', 'en')
            if locale not in ('en', 'ru', 'tg'):
                locale = 'en'

            if locale == 'ru':
                title = "Получено новое достижение! 🏆"
                body = f"Поздравляем с получением награды «{achievement.title}»!"
            elif locale == 'tg':
                title = "Дастоварди нав кушода шуд! 🏆"
                body = f"Шуморо бо гирифтани нишони «{achievement.title}» табрик мекунем!"
            else:
                title = "New Achievement Unlocked! 🏆"
                body = f"Congratulations on earning the \"{achievement.title}\" badge!"

            try:
                await notify_service.notify(user_id, "achievement", title, body, db)
            except Exception:
                pass

    return newly_awarded


async def get_all_achievements(db: AsyncSession):
    result = await db.execute(select(Achievements))
    return result.scalars().all()


async def get_my_achievements(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(Achievements, UserAchievements.earned_at)
        .join(UserAchievements, UserAchievements.achievement_id == Achievements.id)
        .where(UserAchievements.user_id == user_id)
    )

    return [
        {
            'id': achievement.id,
            'code': achievement.code,
            'title': achievement.title,
            'description': achievement.description,
            'category': achievement.category,
            'icon': achievement.icon,
            'earned_at': earned_at,
        }
        for achievement, earned_at in result.all()
    ]
