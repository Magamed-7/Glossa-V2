import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_achievement import Achievements

ACHIEVEMENTS = [
    {'code': 'words_10', 'title': 'First 10 Words', 'category': 'grinder', 'threshold': 10, 'icon': 'words_10'},
    {'code': 'words_50', 'title': '50 Words Learned', 'category': 'grinder', 'threshold': 50, 'icon': 'words_50'},
    {'code': 'words_100', 'title': '100 Words Learned', 'category': 'grinder', 'threshold': 100, 'icon': 'words_100'},
    {'code': 'words_500', 'title': '500 Words Learned', 'category': 'grinder', 'threshold': 500, 'icon': 'words_500'},
    {'code': 'streak_7', 'title': 'Week Streak', 'category': 'learner', 'threshold': 7, 'icon': 'streak_7'},
    {'code': 'streak_30', 'title': 'Month Streak', 'category': 'learner', 'threshold': 30, 'icon': 'streak_30'},
    {'code': 'streak_100', 'title': '100 Day Streak', 'category': 'learner', 'threshold': 100, 'icon': 'streak_100'},
    {'code': 'stories_written_1', 'title': 'First Story', 'category': 'teacher', 'threshold': 1, 'icon': 'stories_written_1'},
    {'code': 'stories_written_5', 'title': '5 Stories Written', 'category': 'teacher', 'threshold': 5, 'icon': 'stories_written_5'},
    {'code': 'stories_written_20', 'title': '20 Stories Written', 'category': 'teacher', 'threshold': 20, 'icon': 'stories_written_20'},
    {'code': 'stories_sold_1', 'title': 'First Sale', 'category': 'teacher', 'threshold': 1, 'icon': 'stories_sold_1'},
    {'code': 'stories_sold_10', 'title': '10 Sales', 'category': 'teacher', 'threshold': 10, 'icon': 'stories_sold_10'},
    {'code': 'friends_5', 'title': '5 Friends', 'category': 'social', 'threshold': 5, 'icon': 'friends_5'},
    {'code': 'friends_20', 'title': '20 Friends', 'category': 'social', 'threshold': 20, 'icon': 'friends_20'},
    {'code': 'reviews_received_10', 'title': '10 Reviews Received', 'category': 'teacher', 'threshold': 10, 'icon': 'reviews_received_10'},
    {'code': 'reviews_5', 'title': '5 Reviews Done', 'category': 'grinder', 'threshold': 5, 'icon': 'reviews_5'},
    {'code': 'reviews_25', 'title': '25 Reviews Done', 'category': 'grinder', 'threshold': 25, 'icon': 'reviews_25'},
]


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
