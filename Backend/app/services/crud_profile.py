from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_profile import ProfilePrivacy, UserLanguages, UserProfiles
from app.models.model_user import Users
from app.schemas.schema_profile import LanguageAdd, PrivacyUpdate, ProfileUpdate
from app.services import crud_social


async def get_profile(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserProfiles).where(UserProfiles.user_id == user_id))
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = UserProfiles(user_id=user_id)
        db.add(profile)

        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            result = await db.execute(select(UserProfiles).where(UserProfiles.user_id == user_id))
            profile = result.scalar_one()
        else:
            await db.refresh(profile)

    return profile


async def update_profile(user_id: int, data: ProfileUpdate, db: AsyncSession):
    profile = await get_profile(user_id, db)

    profile.bio = data.bio if data.bio is not None else profile.bio
    profile.interests = data.interests if data.interests is not None else profile.interests

    await db.commit()
    await db.refresh(profile)
    return profile


async def update_photo(user_id: int, photo_url: str, db: AsyncSession):
    profile = await get_profile(user_id, db)
    profile.photo_url = photo_url

    await db.commit()
    await db.refresh(profile)
    return profile


async def increment_profile_views(user_id: int, db: AsyncSession):
    profile = await get_profile(user_id, db)
    profile.profile_views += 1

    await db.commit()
    await db.refresh(profile)
    return profile


async def add_language(user_id: int, data: LanguageAdd, db: AsyncSession):
    language = UserLanguages(
        user_id=user_id,
        language=data.language,
        level=data.level,
        is_target=data.is_target,
    )

    db.add(language)
    await db.commit()
    await db.refresh(language)
    return language


async def get_user_languages(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserLanguages).where(UserLanguages.user_id == user_id))
    return result.scalars().all()


async def get_privacy(user_id: int, db: AsyncSession):
    result = await db.execute(select(ProfilePrivacy).where(ProfilePrivacy.user_id == user_id))
    privacy = result.scalar_one_or_none()

    if privacy is None:
        privacy = ProfilePrivacy(user_id=user_id)
        db.add(privacy)

        try:
            await db.commit()
        except IntegrityError:
            await db.rollback()
            result = await db.execute(select(ProfilePrivacy).where(ProfilePrivacy.user_id == user_id))
            privacy = result.scalar_one()
        else:
            await db.refresh(privacy)

    return privacy


async def update_privacy(user_id: int, data: PrivacyUpdate, db: AsyncSession):
    privacy = await get_privacy(user_id, db)

    if data.show_stories_count is not None:
        privacy.show_stories_count = data.show_stories_count
    if data.show_achievements is not None:
        privacy.show_achievements = data.show_achievements
    if data.show_current_streak is not None:
        privacy.show_current_streak = data.show_current_streak
    if data.show_best_streak is not None:
        privacy.show_best_streak = data.show_best_streak
    if data.show_languages is not None:
        privacy.show_languages = data.show_languages
    if data.show_language_levels is not None:
        privacy.show_language_levels = data.show_language_levels
    if data.show_followers is not None:
        privacy.show_followers = data.show_followers
    if data.show_services is not None:
        privacy.show_services = data.show_services
    if data.show_books is not None:
        privacy.show_books = data.show_books
    if data.show_subscription is not None:
        privacy.show_subscription = data.show_subscription

    await db.commit()
    await db.refresh(privacy)
    return privacy


async def get_public_profile(user_id: int, viewer_id: int, db: AsyncSession):
    result = await db.execute(select(Users).where(Users.id == user_id))
    target_user = result.scalar_one_or_none()

    if target_user is None:
        return None

    profile = await get_profile(user_id, db)
    privacy = await get_privacy(user_id, db)

    if viewer_id != user_id:
        profile = await increment_profile_views(user_id, db)

    from app.services import crud_subscription
    sub = await crud_subscription.get_active_subscription(user_id, db)
    sub_tier = sub['plan'].code if sub else 'free'
    if not getattr(privacy, 'show_subscription', True):
        sub_tier = 'free'

    data = {
        'user_id': target_user.id,
        'username': target_user.username,
        'bio': profile.bio,
        'interests': profile.interests,
        'photo_url': profile.photo_url,
        'profile_views': profile.profile_views,
        'subscription_tier': sub_tier,
        'created_at': target_user.created_at,
        'show_services': privacy.show_services,
        'show_books': privacy.show_books,
    }

    if privacy.show_languages:
        languages = await get_user_languages(user_id, db)
        data['languages'] = [
            {
                'id': language.id,
                'language': language.language,
                'level': language.level if privacy.show_language_levels else None,
                'is_target': language.is_target,
            }
            for language in languages
        ]

    if privacy.show_followers:
        followers = await crud_social.get_followers(user_id, db)
        following = await crud_social.get_following(user_id, db)
        following_ids = {u.id for u in following}

        data['followers_count'] = len(followers)
        data['following_count'] = len(following)
        data['friends_count'] = len([u for u in followers if u.id in following_ids])

    if privacy.show_current_streak or privacy.show_best_streak:
        from app.services import streaks

        streak = await streaks.get_streak(user_id, db)
        if privacy.show_current_streak:
            data['current_streak'] = streak.current_streak
        if privacy.show_best_streak:
            data['best_streak'] = streak.best_streak

    if privacy.show_achievements:
        from app.services import achievements

        data['achievements'] = await achievements.get_my_achievements(user_id, db)

    if privacy.show_stories_count:
        from sqlalchemy import func

        from app.models.model_content import ReadingProgress

        stories_read = await db.scalar(
            select(func.count()).select_from(ReadingProgress).where(
                ReadingProgress.user_id == user_id, ReadingProgress.is_completed.is_(True)
            )
        )
        data['stories_read_count'] = stories_read or 0

    return data
