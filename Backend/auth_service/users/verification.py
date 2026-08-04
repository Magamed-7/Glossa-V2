import secrets
import string
import threading

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


def _send_email_thread(subject, message, recipient_list):
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=recipient_list,
            fail_silently=False,
        )
    except Exception as exc:
        print(f"Failed to send email to {recipient_list}: {exc}")


def send_verification_email(user):
    if redis_client.exists(_cooldown_key(user.id)):
        raise ResendCooldownError(redis_client.ttl(_cooldown_key(user.id)))

    code = ''.join(secrets.choice(string.digits) for _ in range(6))
    redis_client.set(_code_key(user.id), code, ex=CODE_TTL_SECONDS)

    subject = 'Glossa verification code'
    message = f'Your verification code is {code}. It expires in 10 minutes.'

    thread = threading.Thread(target=_send_email_thread, args=(subject, message, [user.email]))
    thread.start()

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


def _pwd_reset_code_key(email):
    return f'pwd_reset_code:{email}'


def _pwd_reset_cooldown_key(email):
    return f'pwd_reset_cooldown:{email}'


def send_password_reset_email(email):
    if redis_client.exists(_pwd_reset_cooldown_key(email)):
        raise ResendCooldownError(redis_client.ttl(_pwd_reset_cooldown_key(email)))

    code = ''.join(secrets.choice(string.digits) for _ in range(6))
    redis_client.set(_pwd_reset_code_key(email), code, ex=CODE_TTL_SECONDS)

    subject = 'Glossa password reset code'
    message = f'Your password reset code is {code}. It expires in 10 minutes.'

    thread = threading.Thread(target=_send_email_thread, args=(subject, message, [email]))
    thread.start()

    redis_client.set(_pwd_reset_cooldown_key(email), '1', ex=77)
    return code


def verify_password_reset_code(email, code):
    stored = redis_client.get(_pwd_reset_code_key(email))
    if stored is None or stored != code:
        return False
    return True


def delete_password_reset_code(email):
    redis_client.delete(_pwd_reset_code_key(email))

