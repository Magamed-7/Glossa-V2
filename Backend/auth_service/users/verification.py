import secrets
import string

from django.conf import settings
from django.core.mail import send_mail

from users.redis_client import redis_client

CODE_TTL_SECONDS = 600
RESEND_COOLDOWN_SECONDS = 60


class ResendCooldownError(Exception):
    def __init__(self, seconds_left):
        self.seconds_left = seconds_left


class EmailDeliveryError(Exception):
    def __init__(self, message, code=None):
        super().__init__(message)
        self.code = code


def _code_key(user_id):
    return f'email_verify_code:{user_id}'


def _cooldown_key(user_id):
    return f'email_verify_cooldown:{user_id}'


def send_verification_email(user):
    if redis_client.exists(_cooldown_key(user.id)):
        raise ResendCooldownError(redis_client.ttl(_cooldown_key(user.id)))

    code = ''.join(secrets.choice(string.digits) for _ in range(6))
    redis_client.set(_code_key(user.id), code, ex=CODE_TTL_SECONDS)

    try:
        send_mail(
            subject='Glossa verification code',
            message=f'Your verification code is {code}. It expires in 10 minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
    except Exception as exc:
        raise EmailDeliveryError(str(exc), code=code) from exc

    redis_client.set(_cooldown_key(user.id), '1', ex=RESEND_COOLDOWN_SECONDS)
    return code


def confirm_verification_code(user, code):
    stored = redis_client.get(_code_key(user.id))

    if stored is None or stored != code:
        return False

    redis_client.delete(_code_key(user.id))
    user.is_verified = True
    user.save(update_fields=['is_verified'])
    return True
