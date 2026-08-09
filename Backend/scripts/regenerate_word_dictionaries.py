import asyncio
import sys
from pathlib import Path

# Пауза между историями держит нас в бюджете TPM основной (сильной) модели — иначе
# llm_client при 429 молча падает на резервные модели послабее, а те вживую путают
# таджикские переводы (напр. "rich" -> "фақир", то есть "бедный", наоборот).
SECONDS_BETWEEN_STORIES = 22

sys.path.append(str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories
from app.tasks.ai import _generate_story_dictionary


async def main():
    async with AsyncSessionLocal() as db:
        ids = (await db.execute(select(Stories.id).order_by(Stories.id))).scalars().all()

    print(f'{len(ids)} system stories to regenerate')

    ok, failed = 0, []
    for i, story_id in enumerate(ids, 1):
        if i > 1:
            await asyncio.sleep(SECONDS_BETWEEN_STORIES)
        success = await _generate_story_dictionary(story_id, story_type='system')
        if success:
            ok += 1
        else:
            failed.append(story_id)
        print(f'[{i}/{len(ids)}] story {story_id}: {"ok" if success else "FAILED"}', flush=True)

    print(f'Done. ok={ok} failed={len(failed)} {failed}')


if __name__ == '__main__':
    asyncio.run(main())
