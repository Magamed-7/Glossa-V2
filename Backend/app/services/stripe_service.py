from decimal import Decimal

import stripe

from app.core.config import settings
from app.core.errors import AppError


def require_stripe_configured():
    if not settings.STRIPE_SECRET_KEY:
        raise AppError(code='STRIPE_NOT_CONFIGURED', message='Stripe is not configured', status_code=400)

    stripe.api_key = settings.STRIPE_SECRET_KEY


def create_checkout_session(user_id: int, amount: Decimal, currency: str = 'usd'):
    require_stripe_configured()

    session = stripe.checkout.Session.create(
        mode='payment',
        payment_method_types=['card'],
        line_items=[
            {
                'price_data': {
                    'currency': currency,
                    'product_data': {'name': 'Glossa wallet top-up'},
                    'unit_amount': int(amount * 100),
                },
                'quantity': 1,
            }
        ],
        metadata={'user_id': str(user_id)},
        success_url=settings.STRIPE_SUCCESS_URL,
        cancel_url=settings.STRIPE_CANCEL_URL,
    )

    return session.url


def construct_webhook_event(payload: bytes, signature: str | None):
    require_stripe_configured()

    if not settings.STRIPE_WEBHOOK_SECRET:
        raise AppError(code='STRIPE_NOT_CONFIGURED', message='Stripe is not configured', status_code=400)

    try:
        return stripe.Webhook.construct_event(payload, signature, settings.STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        raise AppError(code='INVALID_STRIPE_SIGNATURE', message='Invalid Stripe signature', status_code=400)
