import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories
from app.tasks.ai import _generate_story_audio

CONCURRENCY = 5


async def main():
    async with AsyncSessionLocal() as db:
        story_ids = (
            await db.execute(select(Stories.id).where(Stories.audio_url.is_(None)))
        ).scalars().all()

    print(f'Generating audio for {len(story_ids)} stories')
    semaphore = asyncio.Semaphore(CONCURRENCY)
    stats = {'done': 0, 'failed': []}

    async def one(story_id):
        async with semaphore:
            ok = await _generate_story_audio(story_id)
            stats['done'] += 1
            print(f'  {stats["done"]}/{len(story_ids)} (story {story_id}: {"ok" if ok else "FAILED"})')
            if not ok:
                stats['failed'].append(story_id)

    await asyncio.gather(*(one(sid) for sid in story_ids))

    if stats['failed']:
        print('Failed stories:', stats['failed'])

    print('Done.')


if __name__ == '__main__':
    asyncio.run(main())
