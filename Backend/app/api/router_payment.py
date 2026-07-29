from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_payment import (
    BalanceResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    TopupRequest,
)
from app.services import crud_payment, stripe_service

router_payment = APIRouter(prefix='/balance', tags=['Payments'])
router_stripe = APIRouter(prefix='/stripe', tags=['Stripe'])


@router_payment.get('', response_model=BalanceResponse)
async def get_balance(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_payment.get_or_create_balance(current_user.id, db)


@router_payment.post('/topup', response_model=BalanceResponse)
async def topup_balance(
    data: TopupRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_payment.topup_balance(current_user.id, data.amount, db)


@router_stripe.post('/create-checkout-session', response_model=CheckoutSessionResponse)
async def create_checkout_session(
    data: CheckoutSessionRequest,
    current_user=Depends(get_current_user),
):
    url = stripe_service.create_checkout_session(current_user.id, data.amount, data.currency)
    return {'url': url}
