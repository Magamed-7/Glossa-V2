from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_learning import CardCreate, CardResponse, CardStatusUpdate
from app.services import crud_card

router_deck = APIRouter(prefix='/deck', tags=['Deck'])


@router_deck.post('/', response_model=CardResponse)
async def create_card(
    data: CardCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_card.create_card(data, current_user.id, db)


@router_deck.get('/', response_model=list[CardResponse])
async def get_cards(
    status: str | None = None,
    search: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_card.get_cards(
        db, user_id=current_user.id, status=status, search=search, limit=limit, offset=offset
    )


@router_deck.get('/{card_id}', response_model=CardResponse)
async def get_card(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await crud_card.get_card(card_id, db)

    if card is None:
        raise AppError(code='CARD_NOT_FOUND', message='Card not found', status_code=404)

    return card


@router_deck.patch('/{card_id}/status', response_model=CardResponse)
async def update_card_status(
    card_id: int,
    data: CardStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await crud_card.update_card_status(card_id, data, db)

    if card is None:
        raise AppError(code='CARD_NOT_FOUND', message='Card not found', status_code=404)

    return card


@router_deck.delete('/{card_id}', response_model=CardResponse)
async def delete_card(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await crud_card.delete_card(card_id, db)

    if card is None:
        raise AppError(code='CARD_NOT_FOUND', message='Card not found', status_code=404)

    return card
