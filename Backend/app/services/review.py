from datetime import datetime, timezone

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_card import Cards, ReviewLogs
from app.services import ratings, sm2, streaks
from app.services.crud_card import get_card


async def get_due_cards(user_id: int, db: AsyncSession):
    now = datetime.now(timezone.utc)

    query = select(Cards).where(
        Cards.user_id == user_id,
        or_(Cards.next_review_date.is_(None), Cards.next_review_date <= now),
    )

    result = await db.execute(query)
    return result.scalars().all()


async def submit_review(card_id: int, user_id: int, quality: int, db: AsyncSession):
    card = await get_card(card_id, user_id, db)

    if card is None:
        return None

    result = sm2.apply_sm2(card.ease_factor, card.interval, card.repetitions, quality)

    card.ease_factor = result['ease_factor']
    card.interval = result['interval']
    card.repetitions = result['repetitions']
    card.next_review_date = result['next_review_date']
    card.last_quality = quality

    # Synchronize card status with reviews:
    # - quality >= 4 (Good/Easy) is learned (Mastered)
    # - quality == 3 (Hard) is hard (Difficult)
    # - quality < 3 (Again) is learning (Unlearned)
    if quality >= 4:
        card.status = 'learned'
    elif quality == 3:
        card.status = 'hard'
    else:
        card.status = 'learning'
        # Reset SM-2 schedule to the initial learned state (repetitions = 1, interval = 6, next_review = 6 days)
        from datetime import timedelta
        card.repetitions = 1
        card.interval = 6
        card.ease_factor = 2.5
        card.next_review_date = datetime.now(timezone.utc) + timedelta(days=6)

    review_log = ReviewLogs(card_id=card.id, quality=quality)
    db.add(review_log)

    await db.commit()
    await db.refresh(card)

    await streaks.touch_streak(card.user_id, db)

    if quality >= 3:
        await ratings.award_xp(card.user_id, 'review_passed', db)

    return card
