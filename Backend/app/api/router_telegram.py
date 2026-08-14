from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_notification import TelegramLinkResponse
from app.services import telegram_link_service
from app.models.model_profile import UserProfiles

router_telegram = APIRouter(prefix='/telegram', tags=['Telegram'])


@router_telegram.post('/link', response_model=TelegramLinkResponse)
async def create_telegram_link(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    link = await telegram_link_service.create_link_code(current_user.id, db)
    return {'link': link}


@router_telegram.post('/unlink')
async def unlink_telegram(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = await db.execute(select(UserProfiles).where(UserProfiles.user_id == current_user.id))
    profile = result.scalar_one_or_none()
    if profile:
        profile.telegram_chat_id = None
        await db.commit()
    return {'status': 'ok'}
