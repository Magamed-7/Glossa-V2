import base64
import hashlib
import hmac
import time

import httpx

from app.core.config import settings


def _coturn_ice_servers(user_id: int):
    if not settings.COTURN_SECRET or not settings.COTURN_URLS:
        return None

    expires_at = int(time.time()) + settings.COTURN_CREDENTIAL_TTL_SECONDS
    username = f'{expires_at}:{user_id}'

    digest = hmac.new(settings.COTURN_SECRET.encode(), username.encode(), hashlib.sha1).digest()
    credential = base64.b64encode(digest).decode()

    return [
        {'urls': ['stun:stun.l.google.com:19302']},
        {'urls': settings.COTURN_URLS, 'username': username, 'credential': credential},
    ]


async def _cloudflare_ice_servers():
    if not settings.CLOUDFLARE_TURN_KEY_ID or not settings.CLOUDFLARE_TURN_KEY_SECRET:
        return None

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'https://rtc.live.cloudflare.com/v1/turn/keys/{settings.CLOUDFLARE_TURN_KEY_ID}/credentials/generate-ice-servers',
            headers={'Authorization': f'Bearer {settings.CLOUDFLARE_TURN_KEY_SECRET}'},
            json={'ttl': settings.COTURN_CREDENTIAL_TTL_SECONDS},
        )
        response.raise_for_status()
        return response.json()['iceServers']


async def get_ice_servers(user_id: int):
    if settings.TURN_PROVIDER == 'cloudflare':
        servers = await _cloudflare_ice_servers()
    else:
        servers = _coturn_ice_servers(user_id)

    return servers or [{'urls': ['stun:stun.l.google.com:19302']}]
