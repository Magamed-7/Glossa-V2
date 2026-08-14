import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

import httpx

from app.core.config import settings


async def main():
    if settings.CLOUDFLARE_TURN_KEY_ID and settings.CLOUDFLARE_TURN_KEY_SECRET:
        print('CLOUDFLARE_TURN_KEY_ID/SECRET already set in .env, nothing to do.')
        return

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f'https://api.cloudflare.com/client/v4/accounts/{settings.CLOUDFLARE_ACCOUNT_ID}/calls/turn_keys',
            headers={'Authorization': f'Bearer {settings.CLOUDFLARE_CALLS_API_TOKEN}'},
            json={'name': 'glossa-messenger'},
        )
        response.raise_for_status()
        result = response.json()['result']

    print('Add these two lines to Backend/.env:')
    print(f'CLOUDFLARE_TURN_KEY_ID={result["uid"]}')
    print(f'CLOUDFLARE_TURN_KEY_SECRET={result["key"]}')


if __name__ == '__main__':
    asyncio.run(main())
