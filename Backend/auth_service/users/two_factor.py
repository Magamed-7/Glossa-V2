import secrets

import pyotp
from django.contrib.auth.hashers import check_password, make_password

from users.redis_client import redis_client

PENDING_LOGIN_TTL_SECONDS = 300
BACKUP_CODES_COUNT = 8


def generate_totp_secret():
    return pyotp.random_base32()


def get_totp_uri(user, secret):
    return pyotp.totp.TOTP(secret).provisioning_uri(name=user.email, issuer_name='Glossa')


def verify_totp_code(secret, code):
    return pyotp.totp.TOTP(secret).verify(code, valid_window=1)


def generate_backup_codes():
    codes = [secrets.token_hex(4) for _ in range(BACKUP_CODES_COUNT)]
    hashed = [make_password(code) for code in codes]
    return codes, hashed


def consume_backup_code(user, code):
    if not user.backup_codes:
        return False

    for hashed in user.backup_codes:
        if check_password(code, hashed):
            user.backup_codes = [h for h in user.backup_codes if h != hashed]
            user.save(update_fields=['backup_codes'])
            return True

    return False


def _pending_key(token):
    return f'2fa_pending_login:{token}'


def create_pending_login(user):
    token = secrets.token_urlsafe(32)
    redis_client.set(_pending_key(token), str(user.id), ex=PENDING_LOGIN_TTL_SECONDS)
    return token


def resolve_pending_login(token):
    user_id = redis_client.get(_pending_key(token))

    if user_id is None:
        return None

    redis_client.delete(_pending_key(token))
    return int(user_id)
