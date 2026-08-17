from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.core.limits import enforce_deck_word_limit
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
from app.services import crud_card, review, missions, streaks, crud_subscription

router_deck = APIRouter(prefix='/deck', tags=['Deck'])
router_reviews = APIRouter(prefix='/reviews', tags=['Reviews'])
router_learning = APIRouter(prefix='/learning', tags=['Learning'])



@router_deck.post('/', response_model=CardResponse)
async def create_card(
    data: CardCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(enforce_deck_word_limit),
):
    if data.source_story_id is not None and data.source_story_id < 0:
        from app.core.limits import check_leveled_vocab_limit
        await check_leveled_vocab_limit(current_user.id, db)

    card = await crud_card.create_card(data, current_user.id, db, source_story_id=data.source_story_id)

    if data.source_story_id is None and data.transcription is None:
        from app.core.limits import check_transcription_quota
        from app.tasks.ai import generate_card_transcription_task

        if await check_transcription_quota(current_user.id, db):
            generate_card_transcription_task.delay(card.id)

    return card


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
async def generate_card_audio(
    card_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    from app.services import word_audio

    card = await crud_card.get_card(card_id, current_user.id, db)

    if card is None:
        raise AppError(code='CARD_NOT_FOUND', message='Card not found', status_code=404)

    level = await word_audio.level_for_user(current_user.id, db)
    audio = await word_audio.get_one(card.word, level, db)

    if audio is None:
        raise AppError(code='AUDIO_GENERATION_FAILED', message='Could not generate pronunciation audio', status_code=502)

    return await crud_card.update_audio(card_id, current_user.id, audio['audio_url'], db, accent=audio['accent'])


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


@router_learning.post('/streak/restore', response_model=DailyMissionsResponse)
async def restore_streak(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    streak_obj = await streaks.get_streak(current_user.id, db)
    
    current_month_str = date.today().strftime("%Y-%m")
    if streak_obj.last_restore_month != current_month_str:
        streak_obj.restores_used_this_month = 0
        streak_obj.last_restore_month = current_month_str
        
    sub = await crud_subscription.get_active_subscription(current_user.id, db)
    plan_code = sub["plan"].code if sub and "plan" in sub else "free"
    
    max_restores = 1
    if plan_code == "premium":
        max_restores = 5
    elif plan_code == "pro":
        max_restores = 10
        
    today = date.today()
    
    # We can restore if we have a saved prev_streak_before_reset that is greater than current_streak
    if streak_obj.prev_streak_before_reset <= streak_obj.current_streak:
        raise AppError(code='STREAK_ALREADY_ACTIVE', message='Streak is already active and does not need restoration', status_code=400)
        
    if streak_obj.restores_used_this_month >= max_restores:
        raise AppError(code='NO_RESTORES_REMAINING', message='No restores remaining this month', status_code=400)
        
    # Restore the streak!
    streak_obj.current_streak = streak_obj.prev_streak_before_reset
    streak_obj.best_streak = max(streak_obj.best_streak, streak_obj.current_streak)
    streak_obj.prev_streak_before_reset = 0
    streak_obj.last_activity_date = today
    streak_obj.restores_used_this_month += 1
    
    await db.commit()
    await db.refresh(streak_obj)
    
    return await missions.get_daily_missions(current_user.id, db)

