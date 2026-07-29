from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_profile import UserLanguages, UserProfiles
from app.schemas.schema_profile import LanguageAdd, ProfileUpdate


async def get_profile(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserProfiles).where(UserProfiles.user_id == user_id))
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = UserProfiles(user_id=user_id)
        db.add(profile)
        await db.commit()
        await db.refresh(profile)

    return profile


async def update_profile(user_id: int, data: ProfileUpdate, db: AsyncSession):
    profile = await get_profile(user_id, db)

    profile.bio = data.bio or profile.bio
    profile.interests = data.interests or profile.interests

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
