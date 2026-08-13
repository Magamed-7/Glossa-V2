import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import StoryWords, VocabEntries
from app.services import word_audio

CONCURRENCY = 4


async def _vocab_words_by_level():
    async with AsyncSessionLocal() as db:
        vocab = (await db.execute(select(VocabEntries.word, VocabEntries.cefr_level))).all()

    by_level = {}
    for word, level in vocab:
        by_level.setdefault(level, set()).add(word)

    return by_level


async def _story_words_by_level():
    from app.models.model_content import Stories

    async with AsyncSessionLocal() as db:
        rows = (
            await db.execute(
                select(StoryWords.word, Stories.cefr_level)
                .join(Stories, Stories.id == StoryWords.story_id)
            )
        ).all()

    by_level = {}
    for word, level in rows:
        by_level.setdefault(level, set()).add(word)

    return by_level


async def _generate_for_level(level, words, stats):
    semaphore = asyncio.Semaphore(CONCURRENCY)

    async def one(word):
        async with semaphore:
            async with AsyncSessionLocal() as db:
                result = await word_audio.get_one(word, level, db)
                stats['done'] += 1
                if stats['done'] % 50 == 0:
                    print(f'  {level}: {stats["done"]}/{stats["total"]}')
                if result is None:
                    stats['failed'].append(word)

    await asyncio.gather(*(one(w) for w in words))


async def main():
    vocab_by_level = await _vocab_words_by_level()
    story_by_level = await _story_words_by_level()

    combined = {}
    for level, words in vocab_by_level.items():
        combined.setdefault(level, set()).update(words)
    for level, words in story_by_level.items():
        combined.setdefault(level, set()).update(words)

    total = sum(len(w) for w in combined.values())
    print(f'Backfilling audio for {total} (word, level) pairs across {len(combined)} levels')

    for level, words in combined.items():
        stats = {'done': 0, 'total': len(words), 'failed': []}
        print(f'Level {level}: {len(words)} words')
        await _generate_for_level(level, words, stats)
        if stats['failed']:
            print(f'  {level}: {len(stats["failed"])} failed: {stats["failed"][:10]}')

    print('Done.')


if __name__ == '__main__':
    asyncio.run(main())
