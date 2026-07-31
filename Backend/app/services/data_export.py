from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_user_story import UserStories
from app.services import (
    achievements,
    crud_card,
    crud_notification,
    crud_payment,
    crud_profile,
    crud_settings,
    crud_social,
    crud_subscription,
    crud_user_story,
    streaks,
)


def _language_to_dict(language):
    return {
        'id': language.id,
        'language': language.language,
        'level': language.level,
        'is_target': language.is_target,
        'created_at': language.created_at,
    }


def _card_to_dict(card):
    return {
        'id': card.id,
        'word': card.word,
        'translation': card.translation,
        'example': card.example,
        'status': card.status,
        'ease_factor': card.ease_factor,
        'interval': card.interval,
        'repetitions': card.repetitions,
        'next_review_date': card.next_review_date,
        'last_quality': card.last_quality,
        'created_at': card.created_at,
    }


def _notification_to_dict(notification):
    return {
        'id': notification.id,
        'type': notification.type,
        'title': notification.title,
        'body': notification.body,
        'is_read': notification.is_read,
        'created_at': notification.created_at,
    }


def _purchase_to_dict(purchase):
    return {
        'id': purchase.id,
        'item_type': purchase.item_type,
        'item_id': purchase.item_id,
        'amount': purchase.amount,
        'seller_id': purchase.seller_id,
        'seller_income': purchase.seller_income,
        'created_at': purchase.created_at,
    }


def _user_summary(user):
    return {'id': user.id, 'username': user.username}


async def _get_own_stories(user_id: int, db: AsyncSession):
    result = await db.execute(
        select(UserStories).where(UserStories.author_id == user_id).order_by(UserStories.id.desc())
    )
    stories = result.scalars().all()
    return [crud_user_story.user_story_to_response(story) for story in stories]


async def build_user_export(user_id: int, db: AsyncSession):
    profile = await crud_profile.get_profile(user_id, db)
    privacy = await crud_profile.get_privacy(user_id, db)
    languages = await crud_profile.get_user_languages(user_id, db)
    settings = await crud_settings.get_settings(user_id, db)
    streak = await streaks.get_streak(user_id, db)

    cards = await crud_card.get_cards(db, user_id=user_id, limit=100000)
    learning_stats = await crud_card.get_learning_stats(user_id, db)

    my_achievements = await achievements.get_my_achievements(user_id, db)

    subscription = await crud_subscription.get_active_subscription(user_id, db)
    balance = await crud_payment.get_or_create_balance(user_id, db)
    purchases = await crud_payment.get_payment_history(user_id, db, limit=100000)

    notifications = await crud_notification.get_notifications(user_id, db, limit=100000)

    own_stories = await _get_own_stories(user_id, db)

    followers = await crud_social.get_followers(user_id, db)
    following = await crud_social.get_following(user_id, db)
    friends = await crud_social.get_friends(user_id, db)

    return {
        'profile': {
            'bio': profile.bio,
            'interests': profile.interests,
            'photo_url': profile.photo_url,
            'profile_views': profile.profile_views,
            'created_at': profile.created_at,
        },
        'privacy_settings': {
            'show_stories_count': privacy.show_stories_count,
            'show_achievements': privacy.show_achievements,
            'show_current_streak': privacy.show_current_streak,
            'show_best_streak': privacy.show_best_streak,
            'show_languages': privacy.show_languages,
            'show_language_levels': privacy.show_language_levels,
            'show_followers': privacy.show_followers,
        },
        'languages': [_language_to_dict(language) for language in languages],
        'settings': {
            'target_language': settings.target_language,
            'daily_goal': settings.daily_goal,
            'study_time': settings.study_time,
            'difficulty': settings.difficulty,
            'email_enabled': settings.email_enabled,
            'push_enabled': settings.push_enabled,
            'telegram_enabled': settings.telegram_enabled,
            'reminder_time': settings.reminder_time,
            'ratings_enabled': settings.ratings_enabled,
            'profile_visible': settings.profile_visible,
        },
        'streak': {
            'current_streak': streak.current_streak,
            'best_streak': streak.best_streak,
            'last_activity_date': streak.last_activity_date,
        },
        'deck': {
            'stats': learning_stats,
            'cards': [_card_to_dict(card) for card in cards],
        },
        'achievements': my_achievements,
        'subscription': {
            'plan_code': subscription['plan'].code if subscription['plan'] else None,
            'period': subscription['period'],
            'expires_at': subscription['expires_at'],
            'is_active': subscription['is_active'],
        },
        'wallet': {
            'balance': balance.balance,
            'purchases': [_purchase_to_dict(purchase) for purchase in purchases],
        },
        'notifications': [_notification_to_dict(notification) for notification in notifications],
        'authored_stories': own_stories,
        'social': {
            'followers': [_user_summary(user) for user in followers],
            'following': [_user_summary(user) for user in following],
            'friends': [_user_summary(user) for user in friends],
        },
    }
