import asyncio
import json
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.db.database import AsyncSessionLocal
from app.services import word_audio

VOCAB_PATH = Path(__file__).resolve().parents[2] / 'Frontend' / 'src' / 'data' / 'leveled_vocab.json'
CONCURRENCY = 4


async def _generate_for_level(level, items, stats):
    semaphore = asyncio.Semaphore(CONCURRENCY)

    async def one(item):
        async with semaphore:
            async with AsyncSessionLocal() as db:
                result = await word_audio.get_one(item['word'], level, db)
                stats['done'] += 1
                if stats['done'] % 50 == 0:
                    print(f'  {level}: {stats["done"]}/{stats["total"]}')
                if result is not None:
                    item['audio_url'] = result['audio_url']
                    item['accent'] = result['accent']

    await asyncio.gather(*(one(item) for item in items))


async def main():
    data = json.loads(VOCAB_PATH.read_text(encoding='utf-8'))

    for level, items in data.items():
        stats = {'done': 0, 'total': len(items)}
        print(f'Level {level}: {len(items)} words')
        await _generate_for_level(level, items, stats)

    VOCAB_PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Done, written back to', VOCAB_PATH)


if __name__ == '__main__':
    asyncio.run(main())
