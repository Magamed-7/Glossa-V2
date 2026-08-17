from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_payment import BalanceResponse, PaymentAnalyticsResponse, PaymentHistoryEntry
from app.services import crud_payment

router_payment = APIRouter(prefix='/balance', tags=['Payments'])
router_payments_history = APIRouter(prefix='/payments', tags=['Payments'])


@router_payment.get('', response_model=BalanceResponse)
async def get_balance(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_payment.get_or_create_balance(current_user.id, db)


@router_payments_history.get('/history', response_model=list[PaymentHistoryEntry])
async def get_payment_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_payment.get_payment_history(current_user.id, db, limit=limit, offset=offset)


@router_payments_history.get('/analytics', response_model=PaymentAnalyticsResponse)
async def get_payment_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_payment.get_payment_analytics(current_user.id, db)
