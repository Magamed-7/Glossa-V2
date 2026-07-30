import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import AppError
from app.core.redis_client import redis_client
from app.models.model_profile import UserProfiles
from app.services import crud_subscription

CODE_TTL_SECONDS = 600


def _code_key(code: str):
    return f'telegram:link:{code}'


async def create_link_code(user_id: int, db: AsyncSession):
    subscription = await crud_subscription.get_active_subscription(user_id, db)

    if not subscription['plan'].telegram_access:
        raise AppError(
            code='TELEGRAM_NOT_ALLOWED', message='Telegram is available for premium plans', status_code=403
        )

    code = secrets.token_urlsafe(8)
    await redis_client.set(_code_key(code), str(user_id), ex=CODE_TTL_SECONDS)

    return f'https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={code}'


async def resolve_link_code(code: str):
    user_id = await redis_client.get(_code_key(code))

    if user_id is None:
        return None

    await redis_client.delete(_code_key(code))
    return int(user_id)


async def save_chat_id(user_id: int, chat_id: str, db: AsyncSession):
    result = await db.execute(select(UserProfiles).where(UserProfiles.user_id == user_id))
    profile = result.scalar_one_or_none()

    if profile is None:
        profile = UserProfiles(user_id=user_id)
        db.add(profile)

    profile.telegram_chat_id = chat_id
    await db.commit()
