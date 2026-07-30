from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_notification import NotificationResponse
from app.services import crud_notification

router_notification = APIRouter(prefix='/notifications', tags=['Notifications'])


@router_notification.get('', response_model=list[NotificationResponse])
async def get_notifications(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_notification.get_notifications(current_user.id, db, limit=limit, offset=offset)


@router_notification.patch('/{notification_id}/read', response_model=NotificationResponse)
async def mark_read(
    notification_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    notification = await crud_notification.mark_read(notification_id, current_user.id, db)

    if notification is None:
        raise AppError(code='NOTIFICATION_NOT_FOUND', message='Notification not found', status_code=404)

    return notification


@router_notification.patch('/read-all')
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    await crud_notification.mark_all_read(current_user.id, db)
    return {'status': 'ok'}
