import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select
from sqlalchemy.orm.attributes import flag_modified

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories

BE = {'ru': 'быть', 'tg': 'будан', 'lemma': 'be'}

UPSERTS = {
    38: {'is': BE},
    43: {'is': BE},
    44: {'is': BE},
    45: {'am': BE},
    81: {'are': BE, 'was': BE},
    86: {'is': BE, 'was': BE, 'were': BE},
    12: {
        'say': {'ru': 'говорить', 'tg': 'гуфтан', 'lemma': 'say'},
        'repeat': {'ru': 'повторять', 'tg': 'такрор кардан', 'lemma': 'repeat'},
    },
    14: {
        'say': {'ru': 'говорить', 'tg': 'гуфтан', 'lemma': 'say'},
        'says': {'ru': 'говорить', 'tg': 'гуфтан', 'lemma': 'say'},
    },
    15: {'say': {'ru': 'говорить', 'tg': 'гуфтан', 'lemma': 'say'}},
    17: {'say': {'ru': 'сказать', 'tg': 'гуфтан', 'lemma': 'say'}},
    18: {'say': {'ru': 'говорить', 'tg': 'гуфтан', 'lemma': 'say'}},
    21: {'says': {'ru': 'сказать', 'tg': 'гуфтан', 'lemma': 'say'}},
    22: {'go': {'ru': 'идти', 'tg': 'рафтан', 'lemma': 'go'}},
    29: {'day': {'ru': 'день', 'tg': 'рӯз', 'lemma': 'day'}},
    30: {
        'fish': {'ru': 'рыба', 'tg': 'моҳӣ', 'lemma': 'fish'},
        'study': {'ru': 'изучать', 'tg': 'таҳсил кардан', 'lemma': 'study'},
    },
}

DELETES = {
    38: ['on', 'to'],
}


async def main():
    async with AsyncSessionLocal() as db:
        ids = set(UPSERTS) | set(DELETES)
        rows = (await db.execute(select(Stories).where(Stories.id.in_(ids)))).scalars().all()

        for story in rows:
            wd = dict(story.word_dictionary or {})
            for key in DELETES.get(story.id, []):
                wd.pop(key, None)
            wd.update(UPSERTS.get(story.id, {}))
            story.word_dictionary = wd
            flag_modified(story, 'word_dictionary')
            db.add(story)
            print(f'story {story.id}: fixed {list(UPSERTS.get(story.id, {}).keys())}, deleted {DELETES.get(story.id, [])}')

        await db.commit()
        print('done')


if __name__ == '__main__':
    asyncio.run(main())
