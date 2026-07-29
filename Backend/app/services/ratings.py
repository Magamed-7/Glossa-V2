from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_rating import XpTransactions
from app.services import crud_settings

XP_REWARDS = {
    'review_passed': 10,
    'word_learned': 5,
    'story_written': 50,
    'review_received': 15,
    'social': 2,
}


async def award_xp(user_id: int, reason: str, db: AsyncSession):
    settings = await crud_settings.get_settings(user_id, db)

    if not settings.ratings_enabled:
        return None

    transaction = XpTransactions(user_id=user_id, amount=XP_REWARDS[reason], reason=reason)
    db.add(transaction)
    await db.commit()
    await db.refresh(transaction)
    return transaction
