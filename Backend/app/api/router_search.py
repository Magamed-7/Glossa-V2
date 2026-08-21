import logging

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.es import STORIES_INDEX, VOCABULARY_INDEX, es_client
from app.db.database import get_db
from app.models.model_content import Stories, VocabEntries
from app.services import crud_content, crud_story

logger = logging.getLogger(__name__)

router_search = APIRouter(prefix='/search', tags=['Search'])

LIMIT = 30


def _story_showcase(source: dict):
    return {
        'story_id': source['story_id'],
        'title_en': source['title_en'],
        'genre': source['genre'],
        'cefr_level': source['cefr_level'],
        'is_free': False,
        'author_id': source['author_id'],
    }


@router_search.get('/stories')
async def search_stories(q: str = Query(...), db: AsyncSession = Depends(get_db)):
    try:
        result = await es_client.search(
            index=STORIES_INDEX,
            query={
                'bool': {
                    'must': {
                        'multi_match': {
                            'query': q,
                            'fields': ['title_en', 'title_ru', 'title_tg', 'body_en', 'body_ru', 'body_tg'],
                            'fuzziness': 'AUTO',
                        }
                    },
                    'filter': {'term': {'status': 'published'}},
                }
            },
        )
    except Exception:
        # Elasticsearch is an optional part of the stack and is not running in every
        # deployment. Searching is still expected to answer, so fall back to matching
        # against the database rather than failing the request.
        logger.warning('story search fell back to the database: elasticsearch is unavailable')
        needle = f'%{q}%'
        rows = (
            await db.execute(
                select(Stories)
                .where(or_(Stories.title_en.ilike(needle), Stories.title_ru.ilike(needle), Stories.title_tg.ilike(needle)))
                .order_by(Stories.id)
                .limit(LIMIT)
            )
        ).scalars().all()
        return [crud_story.story_to_response(story) for story in rows]

    hits = []
    for hit in result['hits']['hits']:
        source = hit['_source']
        hits.append(source if source['is_free'] else _story_showcase(source))

    return hits


@router_search.get('/vocabulary')
async def search_vocabulary(q: str = Query(...), locale: str = 'en', db: AsyncSession = Depends(get_db)):
    try:
        result = await es_client.search(
            index=VOCABULARY_INDEX,
            query={
                'multi_match': {
                    'query': q,
                    'fields': ['word', 'translation_ru', 'translation_tg'],
                    'fuzziness': 'AUTO',
                }
            },
        )
    except Exception:
        logger.warning('vocabulary search fell back to the database: elasticsearch is unavailable')
        needle = f'%{q}%'
        rows = (
            await db.execute(
                select(VocabEntries)
                .where(
                    or_(
                        VocabEntries.word.ilike(needle),
                        VocabEntries.translation_ru.ilike(needle),
                        VocabEntries.translation_tg.ilike(needle),
                    )
                )
                .order_by(VocabEntries.word)
                .limit(LIMIT)
            )
        ).scalars().all()
        return await crud_content.vocab_entries_to_responses(rows, locale, db)

    return [hit['_source'] for hit in result['hits']['hits']]
