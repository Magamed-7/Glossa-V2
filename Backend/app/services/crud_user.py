from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_user import Users


async def get_by_id(user_id: int, db: AsyncSession):
    result = await db.execute(select(Users).where(Users.id == user_id))
    return result.scalar_one_or_none()
