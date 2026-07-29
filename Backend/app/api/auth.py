from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import decode_access_token, oauth2_scheme
from app.db.database import get_db
from app.services import crud_user


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

    return user
