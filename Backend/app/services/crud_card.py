from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_card import Cards, ReviewLogs
from app.schemas.schema_learning import CardCreate, CardStatusUpdate
from app.services import ratings


async def create_card(data: CardCreate, user_id: int, db: AsyncSession, source_story_id=None):
    existing = await db.execute(
        select(Cards).where(Cards.user_id == user_id, Cards.word == data.word)
    )

    if existing.scalar_one_or_none() is not None:
        raise AppError(code='CARD_ALREADY_EXISTS', message='Word is already in your deck', status_code=400)

    card = Cards(
        user_id=user_id,
        word=data.word,
        translation=data.translation,
        example=data.example,
        source_story_id=source_story_id,
        transcription=data.transcription,
    )

    db.add(card)
    await db.commit()
    await db.refresh(card)
    await ratings.award_xp(user_id, 'word_learned', db, amount=2)
    return card


async def get_cards(db: AsyncSession, user_id=None, status=None, search=None, limit=20, offset=0):
    query = select(Cards)

    if user_id is not None:
        query = query.where(Cards.user_id == user_id)
    if status:
        query = query.where(Cards.status == status)
    if search:
        query = query.where(Cards.word.ilike(f'%{search}%'))

    query = query.limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


async def get_card(card_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(select(Cards).where(Cards.id == card_id, Cards.user_id == user_id))
    return result.scalar_one_or_none()


async def update_card_status(card_id: int, user_id: int, data: CardStatusUpdate, db: AsyncSession):
    card = await get_card(card_id, user_id, db)

    if card is None:
        return None

    became_learned = data.status == 'learned' and card.status != 'learned'
    card.status = data.status

    if became_learned:
        from datetime import datetime, timedelta, timezone
        card.repetitions = 1
        card.interval = 6
        card.ease_factor = 2.5
        card.next_review_date = datetime.now(timezone.utc) + timedelta(days=6)
    elif data.status == 'learning':
        card.repetitions = 0
        card.interval = 0
        card.ease_factor = 2.5
        card.next_review_date = None

    await db.commit()
    await db.refresh(card)

    if became_learned:
        await ratings.award_xp(card.user_id, 'word_learned', db)
        from app.services.achievements import check_achievements
        await check_achievements(card.user_id, db)

    return card


async def delete_card(card_id: int, user_id: int, db: AsyncSession):
    card = await get_card(card_id, user_id, db)

    if card is None:
        return None

    await db.delete(card)
    await db.commit()
    return card


async def update_audio(card_id: int, user_id: int, audio_url: str, db: AsyncSession):
    card = await get_card(card_id, user_id, db)

    if card is None:
        return None

    card.audio_url = audio_url

    await db.commit()
    await db.refresh(card)
    return card


async def get_learning_stats(user_id: int, db: AsyncSession):
    now = datetime.now(timezone.utc)

    cards_total = await db.scalar(
        select(func.count()).select_from(Cards).where(Cards.user_id == user_id)
    )

    due_today = await db.scalar(
        select(func.count()).select_from(Cards).where(
            Cards.user_id == user_id,
            or_(Cards.next_review_date.is_(None), Cards.next_review_date <= now),
        )
    )

    learned_count = await db.scalar(
        select(func.count()).select_from(Cards).where(
            Cards.user_id == user_id, Cards.status == 'learned'
        )
    )

    reviews_query = select(ReviewLogs).join(Cards, Cards.id == ReviewLogs.card_id).where(
        Cards.user_id == user_id
    )
    reviews = (await db.execute(reviews_query)).scalars().all()

    reviews_total = len(reviews)
    forgotten_count = sum(1 for r in reviews if r.quality < 3)
    remembered_count = reviews_total - forgotten_count
    retention_rate = (remembered_count / reviews_total * 100) if reviews_total > 0 else 0.0

    return {
        'cards_total': cards_total,
        'due_today': due_today,
        'learned_count': learned_count,
        'forgotten_count': forgotten_count,
        'retention_rate': round(retention_rate, 2),
    }
