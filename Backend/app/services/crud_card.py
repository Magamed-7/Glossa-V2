from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_card import Cards
from app.schemas.schema_learning import CardCreate, CardStatusUpdate


async def create_card(data: CardCreate, user_id: int, db: AsyncSession):
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
    )

    db.add(card)
    await db.commit()
    await db.refresh(card)
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


async def get_card(card_id: int, db: AsyncSession):
    result = await db.execute(select(Cards).where(Cards.id == card_id))
    return result.scalar_one_or_none()


async def update_card_status(card_id: int, data: CardStatusUpdate, db: AsyncSession):
    card = await get_card(card_id, db)

    if card is None:
        return None

    card.status = data.status

    await db.commit()
    await db.refresh(card)
    return card


async def delete_card(card_id: int, db: AsyncSession):
    card = await get_card(card_id, db)

    if card is None:
        return None

    await db.delete(card)
    await db.commit()
    return card
