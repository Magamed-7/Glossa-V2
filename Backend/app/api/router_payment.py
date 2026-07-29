from decimal import Decimal

from fastapi import APIRouter, Depends, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_payment import (
    BalanceResponse,
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    PaymentHistoryEntry,
    TopupRequest,
)
from app.services import crud_payment, stripe_service

router_payment = APIRouter(prefix='/balance', tags=['Payments'])
router_stripe = APIRouter(prefix='/stripe', tags=['Stripe'])
router_payments_history = APIRouter(prefix='/payments', tags=['Payments'])


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


@router_stripe.post('/webhook')
async def stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
    stripe_signature: str | None = Header(default=None),
):
    payload = await request.body()
    event = stripe_service.construct_webhook_event(payload, stripe_signature)

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = int(session['metadata']['user_id'])
        amount = Decimal(session['amount_total']) / 100
        await crud_payment.topup_balance(user_id, amount, db)

    return {'status': 'ok'}


@router_payments_history.get('/history', response_model=list[PaymentHistoryEntry])
async def get_payment_history(
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_payment.get_payment_history(current_user.id, db, limit=limit, offset=offset)
