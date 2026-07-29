from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_user import Users


async def get_by_id(user_id: int, db: AsyncSession):
    result = await db.execute(select(Users).where(Users.id == user_id))
    return result.scalar_one_or_none()


async def get_by_ids(user_ids: list[int], db: AsyncSession):
    result = await db.execute(select(Users).where(Users.id.in_(user_ids)))
    return {user.id: user for user in result.scalars().all()}
