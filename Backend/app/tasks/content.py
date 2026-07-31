import asyncio

from sqlalchemy import select

from app.celery_app import celery_app
from app.core.es import STORIES_INDEX, VOCABULARY_INDEX, ensure_indices, es_client
from app.db.database import AsyncSessionLocal
from app.models.model_content import Stories, VocabEntries
from app.models.model_user_story import UserStories


def _run_async(coro):
    return asyncio.run(coro)


async def _index_system_story(story_id: int):
    async with AsyncSessionLocal() as db:
        story = (await db.execute(select(Stories).where(Stories.id == story_id))).scalar_one_or_none()

        if story is None:
            return None

        await ensure_indices()
        await es_client.index(
            index=STORIES_INDEX,
            id=f'system-{story.id}',
            document={
                'story_id': story.id,
                'title_en': story.title_en,
                'title_ru': story.title_ru,
                'title_tg': story.title_tg,
                'body_en': story.body_en,
                'body_ru': story.body_ru,
                'body_tg': story.body_tg,
                'genre': story.genre,
                'cefr_level': story.cefr_level,
                'is_system': True,
                'is_free': True,
                'author_id': None,
                'status': 'published',
            },
        )
        return story.id


async def _index_user_story(story_id: int):
    async with AsyncSessionLocal() as db:
        story = (await db.execute(select(UserStories).where(UserStories.id == story_id))).scalar_one_or_none()

        if story is None:
            return None

        await ensure_indices()
        await es_client.index(
            index=STORIES_INDEX,
            id=f'user-{story.id}',
            document={
                'story_id': story.id,
                'title_en': story.title,
                'title_ru': None,
                'title_tg': None,
                'body_en': story.body,
                'body_ru': None,
                'body_tg': None,
                'genre': story.genre,
                'cefr_level': story.cefr_level,
                'is_system': False,
                'is_free': story.price is None,
                'author_id': story.author_id,
                'status': story.status,
            },
        )
        return story.id


async def _delete_user_story_index(story_id: int):
    await ensure_indices()

    try:
        await es_client.delete(index=STORIES_INDEX, id=f'user-{story_id}')
    except Exception:
        pass


async def _index_vocab_entry(entry_id: int):
    async with AsyncSessionLocal() as db:
        entry = (await db.execute(select(VocabEntries).where(VocabEntries.id == entry_id))).scalar_one_or_none()

        if entry is None:
            return None

        await ensure_indices()
        await es_client.index(
            index=VOCABULARY_INDEX,
            id=entry.id,
            document={
                'entry_id': entry.id,
                'word': entry.word,
                'translation_ru': entry.translation_ru,
                'translation_tg': entry.translation_tg,
                'example_en': entry.example_en,
                'cefr_level': entry.cefr_level,
                'unit': entry.unit,
            },
        )
        return entry.id


@celery_app.task(name='app.tasks.content.index_system_story')
def index_system_story_task(story_id: int):
    return _run_async(_index_system_story(story_id))


@celery_app.task(name='app.tasks.content.index_user_story')
def index_user_story_task(story_id: int):
    return _run_async(_index_user_story(story_id))


@celery_app.task(name='app.tasks.content.delete_user_story_index')
def delete_user_story_index_task(story_id: int):
    return _run_async(_delete_user_story_index(story_id))


@celery_app.task(name='app.tasks.content.index_vocab')
def index_vocab_task(entry_id: int):
    return _run_async(_index_vocab_entry(entry_id))


@celery_app.task(name='app.tasks.content.process_event')
def process_content_event(**kwargs):
    action = kwargs.get('action')

    if action == 'index_system_story':
        return index_system_story_task(kwargs['story_id'])
    if action == 'index_user_story':
        return index_user_story_task(kwargs['story_id'])
    if action == 'delete_user_story_index':
        return delete_user_story_index_task(kwargs['story_id'])
    if action == 'index_vocab':
        return index_vocab_task(kwargs['entry_id'])

    return kwargs
