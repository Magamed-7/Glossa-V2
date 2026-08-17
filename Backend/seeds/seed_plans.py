import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_subscription import Plans

PLANS = [
    {
        'code': 'free',
        'price_monthly': 0,
        'price_half_yearly': 0,
        'price_yearly': 0,
        'stories_per_day': 5,
        'deck_words_per_day': 35,
        'own_stories_per_week': 3,
        'ai_seconds_per_day': 0,
        'audiobooks_per_day': 1,
        'generated_stories_per_day': 0,
        'can_buy_stories': False,
        'telegram_access': True,
    },
    {
        'code': 'premium',
        'price_monthly': 250,
        'price_half_yearly': 1440,
        'price_yearly': 2760,
        'stories_per_day': None,
        'deck_words_per_day': None,
        'own_stories_per_week': 12,
        'ai_seconds_per_day': 9000,
        'audiobooks_per_day': 20,
        'generated_stories_per_day': 12,
        'can_buy_stories': True,
        'telegram_access': True,
    },
    {
        'code': 'pro',
        'price_monthly': 500,
        'price_half_yearly': 2850,
        'price_yearly': 5460,
        'stories_per_day': None,
        'deck_words_per_day': None,
        'own_stories_per_week': 50,
        'ai_seconds_per_day': None,
        'audiobooks_per_day': None,
        'generated_stories_per_day': None,
        'can_buy_stories': True,
        'telegram_access': True,
    },
]


async def seed():
    created = 0
    skipped = 0

    async with AsyncSessionLocal() as db:
        for data in PLANS:
            existing = await db.execute(select(Plans).where(Plans.code == data['code']))

            if existing.scalar_one_or_none() is not None:
                skipped += 1
                continue

            db.add(Plans(**data))
            created += 1

        await db.commit()

    print(f'created: {created}, skipped: {skipped}')


if __name__ == '__main__':
    asyncio.run(seed())
