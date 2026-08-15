import re
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_dc_payment import Order

ORDER_TTL = timedelta(minutes=30)
MAX_OFFSET_CENTS = 100

# Case-insensitive, transliterated Russian keywords — the source SMS/push text comes
# through as Latin transliteration (Tasker/MacroDroid capture), not Cyrillic.
INCOMING_RE = re.compile(r'popolnenie|zachislenie|vkhodyashchiy\s*perevod', re.IGNORECASE)
EXPENSE_RE = re.compile(r'oplata|spisanie|perevod\s*na', re.IGNORECASE)
AMOUNT_RE = re.compile(
    r'(?:\+|Popolnenie:?\s*\+?|Zachislenie:?\s*\+?)\s*(\d+[.,]\d{2})\s*(?:TJS|c|somoni|с)?',
    re.IGNORECASE,
)


async def allocate_unique_amount(base_amount: Decimal, db: AsyncSession) -> Decimal:
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Order.expected_amount).where(Order.status == 'pending', Order.expires_at > now)
    )
    taken = {row[0] for row in result.all()}

    offsets = [Decimal('0.00')]
    for cents in range(1, MAX_OFFSET_CENTS + 1):
        step = Decimal(cents) / 100
        offsets.append(step)
        offsets.append(-step)

    for offset in offsets:
        candidate = (base_amount + offset).quantize(Decimal('0.01'))
        if candidate <= 0:
            continue
        if candidate not in taken:
            return candidate

    raise AppError(code='NO_AMOUNT_SLOTS', message='All amount slots are taken right now, try again shortly', status_code=503)


def classify_incoming_text(text: str):
    """Returns (direction, amount) where direction is 'expense' | 'incoming' | 'unknown'.

    Expense detection runs first and short-circuits per spec — an expense text must
    never be treated as incoming even if it happens to also contain a stray '+'.
    """
    if EXPENSE_RE.search(text):
        return 'expense', None

    is_incoming = bool(INCOMING_RE.search(text)) or '+' in text
    if not is_incoming:
        return 'unknown', None

    match = AMOUNT_RE.search(text)
    if not match:
        return 'incoming', None

    amount = Decimal(match.group(1).replace(',', '.')).quantize(Decimal('0.01'))
    return 'incoming', amount


async def activate_subscription_external(user_id: int, plan_code: str, period: str, db: AsyncSession):
    from app.models.model_subscription import Plans, UserSubscriptions

    plan = (await db.execute(select(Plans).where(Plans.code == plan_code))).scalar_one_or_none()
    if plan is None:
        raise AppError(code='PLAN_NOT_FOUND', message='Plan not found', status_code=404)

    duration = timedelta(days=30) if period == 'monthly' else timedelta(days=365)
    expires_at = datetime.now(timezone.utc) + duration

    await db.execute(
        update(UserSubscriptions)
        .where(UserSubscriptions.user_id == user_id, UserSubscriptions.is_active.is_(True))
        .values(is_active=False)
    )
    db.add(UserSubscriptions(user_id=user_id, plan_id=plan.id, period=period, expires_at=expires_at, is_active=True))


async def create_order(user_id: int, intent: str, base_amount: Decimal, db: AsyncSession, plan_code: str | None = None, period: str | None = None):
    expected_amount = await allocate_unique_amount(base_amount, db)
    order = Order(
        user_id=user_id,
        intent=intent,
        plan_code=plan_code,
        period=period,
        base_amount=base_amount,
        expected_amount=expected_amount,
        status='pending',
        expires_at=datetime.now(timezone.utc) + ORDER_TTL,
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order


async def get_order(order_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(select(Order).where(Order.id == order_id, Order.user_id == user_id))
    order = result.scalar_one_or_none()
    if order is None:
        raise AppError(code='ORDER_NOT_FOUND', message='Order not found', status_code=404)
    return order


async def cancel_order(order_id: int, user_id: int, db: AsyncSession):
    order = await get_order(order_id, user_id, db)
    if order.status != 'pending':
        raise AppError(code='ORDER_NOT_PENDING', message='Order is not pending', status_code=400)
    order.status = 'cancelled'
    await db.commit()
    return order
