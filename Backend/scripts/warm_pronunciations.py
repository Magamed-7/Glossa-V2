"""Fill in pronunciation audio and IPA transcriptions for every word a learner can tap.

Both are generated on demand, which means the first learner to reach a word waits for a
TTS round trip — and gets nothing at all if synthesis is unavailable at that moment. This
walks the whole catalogue up front so every word already has a recording and a
transcription sitting in the database.

Words come from four places, and the last one is the one earlier backfills missed: the
per-story word dictionary, which is exactly what the reader makes clickable.

    python scripts/warm_pronunciations.py [--transcriptions-only|--audio-only]
"""
import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select, text

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories, StoryWords, VocabEntries, WordAudio, WordTranscriptions
from app.services import transcription, word_audio

CONCURRENCY = 8
TRANSCRIPTION_BATCH = 50
LEVELED_VOCAB = Path(__file__).resolve().parents[2] / 'Frontend' / 'src' / 'data' / 'leveled_vocab.json'


def _normalize(word):
    return word.strip().lower()


async def collect_words():
    """Every word worth having audio for, mapped to the level it is first taught at."""
    level_of = {}

    def remember(word, level):
        word = _normalize(word or '')
        if word:
            level_of.setdefault(word, level or 'A1')

    async with AsyncSessionLocal() as db:
        for word, level in (await db.execute(select(VocabEntries.word, VocabEntries.cefr_level))).all():
            remember(word, level)

        rows = (
            await db.execute(
                select(StoryWords.word, Stories.cefr_level).join(Stories, Stories.id == StoryWords.story_id)
            )
        ).all()
        for word, level in rows:
            remember(word, level)

        rows = (
            await db.execute(
                text(
                    'select key, s.cefr_level from stories s, '
                    'lateral jsonb_object_keys(s.word_dictionary) key '
                    'where s.word_dictionary is not null'
                )
            )
        ).all()
        for word, level in rows:
            remember(word, level)

    if LEVELED_VOCAB.exists():
        bundled = json.loads(LEVELED_VOCAB.read_text(encoding='utf-8'))
        for level, items in bundled.items():
            for item in items:
                remember(item.get('word'), level)

    return level_of


async def warm_audio(level_of):
    async with AsyncSessionLocal() as db:
        have = {row[0] for row in (await db.execute(select(WordAudio.word))).all()}

    missing = sorted(w for w in level_of if w not in have)
    print(f'audio: {len(level_of)} words total, {len(have)} already recorded, {len(missing)} to generate')

    semaphore = asyncio.Semaphore(CONCURRENCY)
    stats = {'done': 0, 'failed': []}

    async def one(word):
        async with semaphore:
            async with AsyncSessionLocal() as db:
                result = await word_audio.get_one(word, level_of[word], db)
            stats['done'] += 1
            if result is None:
                stats['failed'].append(word)
            if stats['done'] % 100 == 0:
                print(f'  {stats["done"]}/{len(missing)}')

    await asyncio.gather(*(one(w) for w in missing))

    if stats['failed']:
        print(f'  {len(stats["failed"])} failed, first few: {stats["failed"][:10]}')
    return stats


async def warm_transcriptions(level_of):
    async with AsyncSessionLocal() as db:
        have = {row[0] for row in (await db.execute(select(WordTranscriptions.word))).all()}

    missing = sorted(w for w in level_of if w not in have)
    print(f'transcriptions: {len(have)} already known, {len(missing)} to generate')

    done = 0
    for i in range(0, len(missing), TRANSCRIPTION_BATCH):
        chunk = missing[i:i + TRANSCRIPTION_BATCH]
        async with AsyncSessionLocal() as db:
            await transcription.get_many(chunk, db)
        done += len(chunk)
        print(f'  {done}/{len(missing)}')


async def main():
    flags = set(sys.argv[1:])
    level_of = await collect_words()

    if '--transcriptions-only' not in flags:
        await warm_audio(level_of)
    if '--audio-only' not in flags:
        await warm_transcriptions(level_of)

    async with AsyncSessionLocal() as db:
        audio = (await db.execute(select(WordAudio.word))).all()
        ipa = (await db.execute(select(WordTranscriptions.word))).all()

    print(f'done: {len(audio)} recordings, {len(ipa)} transcriptions')


if __name__ == '__main__':
    asyncio.run(main())
