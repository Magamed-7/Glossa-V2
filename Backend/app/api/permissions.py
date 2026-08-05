from fastapi import Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.models.model_profile import UserLanguages

CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']


def require_roles(roles: list[str]):
    async def dependency(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise AppError(code='FORBIDDEN', message='You do not have access to this resource', status_code=403)

        return current_user

    return dependency


async def require_writer_level(
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserLanguages).where(UserLanguages.user_id == current_user.id, UserLanguages.is_target.is_(True))
    )
    language = result.scalar_one_or_none()
    level = language.level if language is not None else 'A1'

    if level != 'native' and CEFR_ORDER.index(level) < CEFR_ORDER.index('B2'):
        raise AppError(
            code='WRITER_LEVEL_REQUIRED',
            message='Writing stories requires Upper-Intermediate level',
            status_code=403,
        )

    return current_user
