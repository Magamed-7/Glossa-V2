import secrets
import string
import threading

from django.conf import settings
from django.core.mail import send_mail

from users.redis_client import redis_client

CODE_TTL_SECONDS = 600
RESEND_COOLDOWN_SECONDS = 60
PENDING_LOGIN_TTL_SECONDS = 300


class ResendCooldownError(Exception):
    def __init__(self, seconds_left):
        self.seconds_left = seconds_left


def _generate_code():
    return ''.join(secrets.choice(string.digits) for _ in range(6))


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


def _send_code_email(email, code, subject):
    message = f'Your code is {code}. It expires in 10 minutes.'
    thread = threading.Thread(target=_send_email_thread, args=(subject, message, [email]))
    thread.start()


def _enable_code_key(user_id):
    return f'2fa_enable_code:{user_id}'


def _enable_cooldown_key(user_id):
    return f'2fa_enable_cooldown:{user_id}'


def send_enable_code(user):
    if redis_client.exists(_enable_cooldown_key(user.id)):
        raise ResendCooldownError(redis_client.ttl(_enable_cooldown_key(user.id)))

    code = _generate_code()
    redis_client.set(_enable_code_key(user.id), code, ex=CODE_TTL_SECONDS)
    _send_code_email(user.email, code, 'Glossa: enable two-factor authentication')
    redis_client.set(_enable_cooldown_key(user.id), '1', ex=RESEND_COOLDOWN_SECONDS)


def confirm_enable_code(user, code):
    stored = redis_client.get(_enable_code_key(user.id))

    if stored is None or stored != code:
        return False

    redis_client.delete(_enable_code_key(user.id))
    user.is_2fa_enabled = True
    user.save(update_fields=['is_2fa_enabled'])
    return True


def _disable_code_key(user_id):
    return f'2fa_disable_code:{user_id}'


def _disable_cooldown_key(user_id):
    return f'2fa_disable_cooldown:{user_id}'


def send_disable_code(user):
    if redis_client.exists(_disable_cooldown_key(user.id)):
        raise ResendCooldownError(redis_client.ttl(_disable_cooldown_key(user.id)))

    code = _generate_code()
    redis_client.set(_disable_code_key(user.id), code, ex=CODE_TTL_SECONDS)
    _send_code_email(user.email, code, 'Glossa: disable two-factor authentication')
    redis_client.set(_disable_cooldown_key(user.id), '1', ex=RESEND_COOLDOWN_SECONDS)


def confirm_disable_code(user, code):
    stored = redis_client.get(_disable_code_key(user.id))

    if stored is None or stored != code:
        return False

    redis_client.delete(_disable_code_key(user.id))
    user.is_2fa_enabled = False
    user.save(update_fields=['is_2fa_enabled'])
    return True


def _pending_user_key(token):
    return f'2fa_pending_login_user:{token}'


def _pending_code_key(token):
    return f'2fa_pending_login_code:{token}'


def create_pending_login(user):
    token = secrets.token_urlsafe(32)
    code = _generate_code()

    redis_client.set(_pending_user_key(token), str(user.id), ex=PENDING_LOGIN_TTL_SECONDS)
    redis_client.set(_pending_code_key(token), code, ex=PENDING_LOGIN_TTL_SECONDS)
    _send_code_email(user.email, code, 'Glossa: your login code')

    return token


def resolve_pending_user_id(token):
    user_id = redis_client.get(_pending_user_key(token))
    return user_id


def verify_login_code(token, code):
    stored_code = redis_client.get(_pending_code_key(token))
    user_id = redis_client.get(_pending_user_key(token))

    if user_id is None or stored_code is None or stored_code != code:
        return None

    redis_client.delete(_pending_user_key(token))
    redis_client.delete(_pending_code_key(token))
    return int(user_id)
