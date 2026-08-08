from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_settings import UserSettings
from app.schemas.schema_settings import SettingsUpdate


async def get_settings(user_id: int, db: AsyncSession):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == user_id))
    settings = result.scalar_one_or_none()

    if settings is None:
        settings = UserSettings(user_id=user_id)
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


async def update_settings(user_id: int, data: SettingsUpdate, db: AsyncSession):
    settings = await get_settings(user_id, db)

    if data.target_language is not None:
        settings.target_language = data.target_language
    if data.daily_goal is not None:
        settings.daily_goal = data.daily_goal
    if data.difficulty is not None:
        settings.difficulty = data.difficulty
    if 'study_time' in data.model_fields_set:
        settings.study_time = data.study_time
    if 'reminder_time' in data.model_fields_set:
        settings.reminder_time = data.reminder_time

    if data.email_enabled is not None:
        settings.email_enabled = data.email_enabled
    if data.push_enabled is not None:
        settings.push_enabled = data.push_enabled
    if data.telegram_enabled is not None:
        settings.telegram_enabled = data.telegram_enabled
    ratings_disabled_now = data.ratings_enabled is False and settings.ratings_enabled

    if data.ratings_enabled is not None:
        settings.ratings_enabled = data.ratings_enabled
    if data.profile_visible is not None:
        settings.profile_visible = data.profile_visible

    await db.commit()
    await db.refresh(settings)

    if ratings_disabled_now:
        from app.services import ratings
        await ratings.remove_from_leaderboards(user_id)

    return settings
