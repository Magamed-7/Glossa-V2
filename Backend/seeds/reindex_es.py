import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.core.es import ensure_indices
from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories, VocabEntries
from app.models.model_user_story import UserStories
from app.tasks.content import _index_system_story, _index_user_story, _index_vocab_entry


async def reindex():
    await ensure_indices()

    async with AsyncSessionLocal() as db:
        system_story_ids = (await db.execute(select(Stories.id))).scalars().all()
        user_story_ids = (
            await db.execute(select(UserStories.id).where(UserStories.status == 'published'))
        ).scalars().all()
        vocab_ids = (await db.execute(select(VocabEntries.id))).scalars().all()

    for story_id in system_story_ids:
        await _index_system_story(story_id)

    for story_id in user_story_ids:
        await _index_user_story(story_id)

    for entry_id in vocab_ids:
        await _index_vocab_entry(entry_id)

    print(
        f'reindexed: {len(system_story_ids)} system stories, '
        f'{len(user_story_ids)} user stories, {len(vocab_ids)} vocabulary entries'
    )


if __name__ == '__main__':
    asyncio.run(reindex())
