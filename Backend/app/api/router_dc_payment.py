import json
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Header, Request
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.config import settings
from app.core.errors import AppError
from app.db.database import get_db
from app.models.model_dc_payment import Order, PaymentLog
from app.schemas.schema_dc_payment import CreateOrderRequest, DcWebhookPayload, OrderResponse
from app.services import crud_payment, dc_payment

router_dc_payment = APIRouter(prefix='/payments', tags=['DC Card Payments'])
logger = logging.getLogger('dc_payment')


def _order_amount_label(order: Order) -> str:
    return f'{order.expected_amount} TJS'


async def _remove_invoice_message(order: Order):
    from app.core.redis_client import redis_client
    from app.tasks.notifications import delete_telegram_message_task

    key = dc_payment.invoice_message_key(order.id)
    stored = await redis_client.get(key)
    if not stored:
        return

    chat_id, _, message_id = stored.partition(':')
    if message_id.isdigit():
        delete_telegram_message_task.delay(chat_id=chat_id, message_id=int(message_id))
    await redis_client.delete(key)


async def _notify_user(order: Order):
    from app.tasks.notifications import send_telegram_task
    from app.services import notify_service
    from app.db.database import AsyncSessionLocal

    await _remove_invoice_message(order)

    async with AsyncSessionLocal() as db:
        chat_id = await notify_service.get_telegram_chat_id(order.user_id, db)

    if chat_id:
        send_telegram_task.delay(
            chat_id=chat_id,
            title='✅ Оплата получена!',
            body=f'Оплата {_order_amount_label(order)} получена! Заказ успешно выполнен.',
        )


async def _parse_webhook_body(request: Request) -> DcWebhookPayload:
    """Tolerant body parser for the phone-side forwarder.

    MacroDroid interpolates the raw notification text straight into a JSON template,
    so a multi-line bank notification produces JSON with literal newlines inside a
    string — invalid per spec, which is why strict parsing rejected exactly the
    payment notifications we care about while letting single-line noise through.
    `strict=False` accepts those control characters; a non-JSON body is treated as
    the notification text itself.
    """
    raw = (await request.body()).decode('utf-8', errors='replace').strip()
    if not raw:
        raise AppError(code='EMPTY_BODY', message='Request body is empty', status_code=400)

    if raw.startswith('{'):
        try:
            return DcWebhookPayload(**json.loads(raw, strict=False))
        except (json.JSONDecodeError, ValidationError, TypeError):
            logger.warning('dc webhook: body looked like JSON but did not parse, falling back to raw text')

    return DcWebhookPayload(text=raw, source=request.query_params.get('source', 'push'))


@router_dc_payment.post('/webhook/dc')
async def dc_webhook(
    request: Request,
    x_secret_token: str = Header(None, alias='X-Secret-Token'),
    db: AsyncSession = Depends(get_db),
):
    if not settings.WEBHOOK_SECRET_TOKEN or x_secret_token != settings.WEBHOOK_SECRET_TOKEN:
        raise AppError(code='UNAUTHORIZED', message='Invalid secret token', status_code=401)

    payload = await _parse_webhook_body(request)

    received_at = payload.received_at or datetime.now(timezone.utc)

    existing = (
        await db.execute(select(PaymentLog).where(PaymentLog.raw_text == payload.text))
    ).scalar_one_or_none()
    if existing is not None:
        db.add(PaymentLog(
            raw_text=payload.text, source=payload.source, parsed_amount=existing.parsed_amount,
            is_incoming=existing.is_incoming, status='DUPLICATE', received_at=received_at,
        ))
        await db.commit()
        return {'status': 'duplicate'}

    direction, amount = dc_payment.classify_incoming_text(payload.text)

    if direction == 'expense':
        db.add(PaymentLog(
            raw_text=payload.text, source=payload.source, parsed_amount=amount,
            is_incoming=False, status='IGNORED_EXPENSE', received_at=received_at,
        ))
        await db.commit()
        return {'status': 'ignored_expense'}

    if direction != 'incoming' or amount is None:
        db.add(PaymentLog(
            raw_text=payload.text, source=payload.source, parsed_amount=amount,
            is_incoming=False, status='UNMATCHED', received_at=received_at,
        ))
        await db.commit()
        return {'status': 'unmatched'}

    now = datetime.now(timezone.utc)
    order = (
        await db.execute(
            select(Order)
            .where(Order.expected_amount == amount, Order.status == 'pending', Order.expires_at > now)
            .with_for_update(skip_locked=True)
        )
    ).scalar_one_or_none()

    if order is None:
        db.add(PaymentLog(
            raw_text=payload.text, source=payload.source, parsed_amount=amount,
            is_incoming=True, status='UNMATCHED', received_at=received_at,
        ))
        await db.commit()
        # Про непривязанный платёж бот не пишет никому. Раньше сюда уходил текст
        # банковского уведомления целиком — а это чужие деньги и чужие данные:
        # отправитель, сумма, остаток по счёту. Платёж остаётся в payment_logs, где ему
        # и место, а сообщение уходит только тогда, когда оплата действительно получена.
        logger.info('incoming payment matched no pending order, amount=%s', amount)
        return {'status': 'unmatched'}

    order.status = 'paid'
    order.paid_at = now

    if order.intent == 'top_up':
        # Credit base_amount, not expected_amount — the gap between them is the top-up
        # fee (see dc_payment.TOPUP_FEE_RATE) plus the unique-cents offset, neither of
        # which should land in the user's wallet.
        await crud_payment.topup_balance(order.user_id, order.base_amount, db)
    elif order.intent == 'subscription':
        await dc_payment.activate_subscription_external(order.user_id, order.plan_code, order.period, db)

    db.add(PaymentLog(
        raw_text=payload.text, source=payload.source, parsed_amount=amount,
        is_incoming=True, status='MATCHED', order_id=order.id, received_at=received_at,
    ))
    await db.commit()

    await _notify_user(order)
    return {'status': 'matched', 'order_id': order.id}


@router_dc_payment.post('/orders', response_model=OrderResponse)
async def create_order(
    data: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    if data.intent == 'top_up':
        if data.base_amount is None or data.base_amount <= 0:
            raise AppError(code='INVALID_AMOUNT', message='base_amount is required for top_up', status_code=400)
        return await dc_payment.create_order(current_user.id, 'top_up', data.base_amount, db)

    if data.intent == 'subscription':
        if not data.plan_code or data.period not in ('monthly', 'half_yearly', 'yearly'):
            raise AppError(code='INVALID_SUBSCRIPTION_ORDER', message='plan_code and period are required', status_code=400)

        from app.services import crud_subscription
        plan = await crud_subscription.get_plan_by_code(data.plan_code, db)
        if plan is None:
            raise AppError(code='PLAN_NOT_FOUND', message='Plan not found', status_code=404)

        base_amount = crud_subscription._plan_price(plan, data.period)
        return await dc_payment.create_order(
            current_user.id, 'subscription', base_amount, db, plan_code=data.plan_code, period=data.period
        )

    raise AppError(code='INVALID_INTENT', message='intent must be top_up or subscription', status_code=400)


@router_dc_payment.get('/orders/{order_id}', response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await dc_payment.get_order(order_id, current_user.id, db)


@router_dc_payment.post('/orders/{order_id}/cancel', response_model=OrderResponse)
async def cancel_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await dc_payment.cancel_order(order_id, current_user.id, db)
