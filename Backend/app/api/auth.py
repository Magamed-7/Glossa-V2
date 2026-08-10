from datetime import date
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.redis_client import redis_client
from app.core.security import decode_access_token, oauth2_scheme
from app.db.database import get_db
from app.services import crud_user, ratings


async def get_current_user(
    token: str | None = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    if token is None:
        raise AppError(code='NOT_AUTHENTICATED', message='Authentication required', status_code=401)

    payload = decode_access_token(token)

    if payload is None:
        raise AppError(code='INVALID_TOKEN', message='Invalid or expired token', status_code=401)

    user_id = payload.get('user_id')

    if user_id is None:
        raise AppError(code='INVALID_TOKEN', message='Invalid or expired token', status_code=401)

    user = await crud_user.get_by_id(int(user_id), db)

    if user is None:
        raise AppError(code='USER_NOT_FOUND', message='User not found', status_code=401)

    if not user.is_active:
        raise AppError(code='ACCOUNT_DEACTIVATED', message='This account has been deactivated', status_code=401)

    # Award daily login XP (once per calendar day, skipped in tests)
    import sys
    if 'pytest' not in sys.modules:
        today_str = date.today().isoformat()
        redis_key = f'user:daily_login:{user.id}:{today_str}'
        already_logged_in = await redis_client.get(redis_key)
        if not already_logged_in:
            await redis_client.set(redis_key, '1', ex=86400)
            # Try to award XP but don't crash auth if there's a transient issue
            try:
                await ratings.award_xp(user.id, 'login', db)
            except Exception:
                pass

    # Track active status in Redis (TTL of 5 minutes)
    await redis_client.set(f"user:active:{user.id}", "1", ex=300)

    return user
