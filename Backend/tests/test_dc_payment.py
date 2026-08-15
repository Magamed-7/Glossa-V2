from decimal import Decimal

import pytest

from app.services import dc_payment
from app.models.model_dc_payment import Order
from app.models import model_user  # noqa: F401 — needed for FK resolution during flush


# ── classify_incoming_text: expense filter + regex parser ──────────────────

def test_expense_is_ignored_even_with_amount():
    direction, amount = dc_payment.classify_incoming_text('Spisanie: -50.00 TJS. Karta *1234')
    assert direction == 'expense'
    assert amount is None


def test_oplata_is_expense():
    direction, _ = dc_payment.classify_incoming_text('Oplata: 120.00 TJS v magazine')
    assert direction == 'expense'


def test_perevod_na_is_expense():
    direction, _ = dc_payment.classify_incoming_text('Perevod na kartu 1234: -30.00 TJS')
    assert direction == 'expense'


def test_popolnenie_parses_amount():
    direction, amount = dc_payment.classify_incoming_text('Popolnenie: +10.04 TJS. Karta: *1234. Ostatok: 50.00 TJS')
    assert direction == 'incoming'
    assert amount == Decimal('10.04')


def test_zachislenie_parses_amount():
    direction, amount = dc_payment.classify_incoming_text('Zachislenie: 25.50 c. Balance 100.00')
    assert direction == 'incoming'
    assert amount == Decimal('25.50')


def test_bare_plus_is_incoming():
    direction, amount = dc_payment.classify_incoming_text('+15.00 TJS zachisleno na kartu')
    assert direction == 'incoming'
    assert amount == Decimal('15.00')


def test_comma_decimal_separator_normalized():
    direction, amount = dc_payment.classify_incoming_text('Popolnenie: +9,95 TJS')
    assert direction == 'incoming'
    assert amount == Decimal('9.95')


def test_no_keywords_no_plus_is_unknown():
    direction, amount = dc_payment.classify_incoming_text('Balance inquiry: Ostatok 50.00 TJS')
    assert direction == 'unknown'
    assert amount is None


# ── allocate_unique_amount ──────────────────────────────────────────────────

async def test_allocate_returns_base_amount_when_free(db):
    result = await dc_payment.allocate_unique_amount(Decimal('100.00'), db)
    assert result == Decimal('100.00')


async def test_allocate_skips_taken_amounts(db, user):
    from datetime import datetime, timedelta, timezone

    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)
    db.add(Order(
        user_id=user.id, intent='top_up', base_amount=Decimal('100.00'), expected_amount=Decimal('100.00'),
        status='pending', expires_at=expires_at,
    ))
    db.add(Order(
        user_id=user.id, intent='top_up', base_amount=Decimal('100.00'), expected_amount=Decimal('100.01'),
        status='pending', expires_at=expires_at,
    ))
    await db.commit()

    result = await dc_payment.allocate_unique_amount(Decimal('100.00'), db)
    assert result == Decimal('99.99')


async def test_allocate_excludes_non_positive_candidates(db):
    result = await dc_payment.allocate_unique_amount(Decimal('0.00'), db)
    assert result > 0
    assert result == Decimal('0.01')


async def test_allocate_raises_when_exhausted(db, user, monkeypatch):
    from datetime import datetime, timedelta, timezone

    monkeypatch.setattr(dc_payment, 'MAX_OFFSET_CENTS', 1)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    for value in (Decimal('50.00'), Decimal('50.01'), Decimal('49.99')):
        db.add(Order(
            user_id=user.id, intent='top_up', base_amount=Decimal('50.00'), expected_amount=value,
            status='pending', expires_at=expires_at,
        ))
    await db.commit()

    from app.core.errors import AppError
    with pytest.raises(AppError):
        await dc_payment.allocate_unique_amount(Decimal('50.00'), db)


async def test_allocate_ignores_expired_orders(db, user):
    from datetime import datetime, timedelta, timezone

    db.add(Order(
        user_id=user.id, intent='top_up', base_amount=Decimal('75.00'), expected_amount=Decimal('75.00'),
        status='pending', expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
    ))
    await db.commit()

    result = await dc_payment.allocate_unique_amount(Decimal('75.00'), db)
    assert result == Decimal('75.00')
