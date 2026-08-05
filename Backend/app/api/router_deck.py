from fastapi import APIRouter, Depends, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.core.limits import enforce_deck_word_limit
from app.core.storage import ALLOWED_AUDIO_TYPES, read_upload, upload_file
from app.db.database import get_db
from app.schemas.schema_learning import (
    CardCreate,
    CardResponse,
    CardStatusUpdate,
    LearningStats,
    ReviewResponse,
    ReviewSubmit,
    DailyMissionsResponse,
)
from app.services import crud_card, review, missions

router_deck = APIRouter(prefix='/deck', tags=['Deck'])
router_reviews = APIRouter(prefix='/reviews', tags=['Reviews'])
router_learning = APIRouter(prefix='/learning', tags=['Learning'])


@router_deck.post('/', response_model=CardResponse)
async def create_card(
    data: CardCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(enforce_deck_word_limit),
):
    return await crud_card.create_card(data, current_user.id, db, source_story_id=data.source_story_id)


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
    card = await crud_card.get_card(card_id, current_user.id, db)

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
    card = await crud_card.update_card_status(card_id, current_user.id, data, db)

    if card is None:
        raise AppError(code='CARD_NOT_FOUND', message='Card not found', status_code=404)

    return card


@router_deck.delete('/{card_id}', response_model=CardResponse)
async def delete_card(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await crud_card.delete_card(card_id, current_user.id, db)

    if card is None:
        raise AppError(code='CARD_NOT_FOUND', message='Card not found', status_code=404)

    return card


@router_deck.post('/{card_id}/audio', response_model=CardResponse)
async def upload_card_audio(
    card_id: int,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    file_bytes = await read_upload(file)
    audio_url = upload_file('pronunciations', file_bytes, file.filename, file.content_type, ALLOWED_AUDIO_TYPES)
    card = await crud_card.update_audio(card_id, current_user.id, audio_url, db)

    if card is None:
        raise AppError(code='CARD_NOT_FOUND', message='Card not found', status_code=404)

    return card


@router_reviews.get('/today', response_model=list[CardResponse])
async def get_reviews_today(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await review.get_due_cards(current_user.id, db)


@router_reviews.post('/{card_id}', response_model=ReviewResponse)
async def submit_review(
    card_id: int,
    data: ReviewSubmit,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    card = await review.submit_review(card_id, current_user.id, data.quality, db)

    if card is None:
        raise AppError(code='CARD_NOT_FOUND', message='Card not found', status_code=404)

    return card


@router_learning.get('/stats', response_model=LearningStats)
async def get_learning_stats(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_card.get_learning_stats(current_user.id, db)


@router_learning.get('/daily-missions', response_model=DailyMissionsResponse)
async def get_daily_missions(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await missions.get_daily_missions(current_user.id, db)
