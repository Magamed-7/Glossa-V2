import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_achievement import Achievements

ACHIEVEMENTS = []

# --- 1. Words Learned (30 achievements) ---
word_thresholds = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1500, 2000, 3000, 5000]
for t in word_thresholds:
    ACHIEVEMENTS.append({
        'code': f'words_{t}',
        'title': f'Vocabulary Level {t}',
        'description': f'Learn a total of {t} words in your personal deck.',
        'category': 'grinder',
        'threshold': t,
        'icon': 'menu_book'
    })

# --- 2. Streak Days (23 achievements) ---
streak_thresholds = [1, 2, 3, 4, 5, 6, 7, 10, 14, 21, 30, 45, 60, 75, 90, 100, 120, 150, 180, 200, 250, 300, 365]
for t in streak_thresholds:
    ACHIEVEMENTS.append({
        'code': f'streak_{t}',
        'title': f'Consistency {t} Days',
        'description': f'Maintain a streak of active study for {t} days.',
        'category': 'learner',
        'threshold': t,
        'icon': 'local_fire_department'
    })

# --- 3. Friends (15 achievements) ---
friends_thresholds = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30, 40, 50, 75, 100]
for t in friends_thresholds:
    ACHIEVEMENTS.append({
        'code': f'friends_{t}',
        'title': f'Socializer Level {t}',
        'description': f'Connect with {t} friends in the community.',
        'category': 'social',
        'threshold': t,
        'icon': 'group'
    })

# --- 4. Reviews Done (18 achievements) ---
reviews_thresholds = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 300, 500]
for t in reviews_thresholds:
    ACHIEVEMENTS.append({
        'code': f'reviews_{t}',
        'title': f'Spaced Reviewer Level {t}',
        'description': f'Complete {t} reviews of vocabulary cards.',
        'category': 'grinder',
        'threshold': t,
        'icon': 'rate_review'
    })

# --- 5. Stories Written (13 achievements) ---
written_thresholds = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30, 40, 50]
for t in written_thresholds:
    ACHIEVEMENTS.append({
        'code': f'stories_written_{t}',
        'title': f'Author Level {t}',
        'description': f'Write and publish {t} stories in the library.',
        'category': 'teacher',
        'threshold': t,
        'icon': 'history_edu'
    })

# --- 6. Stories Sold (14 achievements) ---
sold_thresholds = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30, 40, 50, 100]
for t in sold_thresholds:
    ACHIEVEMENTS.append({
        'code': f'stories_sold_{t}',
        'title': f'Publisher Level {t}',
        'description': f'Sell your published stories to {t} learners.',
        'category': 'teacher',
        'threshold': t,
        'icon': 'payments'
    })

# --- 7. Reviews Received (14 achievements) ---
received_thresholds = [1, 2, 3, 4, 5, 7, 10, 15, 20, 25, 30, 40, 50, 100]
for t in received_thresholds:
    ACHIEVEMENTS.append({
        'code': f'reviews_received_{t}',
        'title': f'Acclaimed Author Level {t}',
        'description': f'Receive {t} reviews on your published stories.',
        'category': 'teacher',
        'threshold': t,
        'icon': 'stars'
    })


async def seed():
    created = 0
    skipped = 0

    async with AsyncSessionLocal() as db:
        for data in ACHIEVEMENTS:
            existing = await db.execute(select(Achievements).where(Achievements.code == data['code']))

            if existing.scalar_one_or_none() is not None:
                skipped += 1
                continue

            db.add(Achievements(**data))
            created += 1

        await db.commit()

    print(f'created: {created}, skipped: {skipped}')


if __name__ == '__main__':
    asyncio.run(seed())
