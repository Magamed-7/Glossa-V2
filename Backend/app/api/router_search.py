from fastapi import APIRouter, Query

from app.core.es import STORIES_INDEX, VOCABULARY_INDEX, es_client

router_search = APIRouter(prefix='/search', tags=['Search'])


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
async def search_stories(q: str = Query(...)):
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

    hits = []
    for hit in result['hits']['hits']:
        source = hit['_source']
        hits.append(source if source['is_free'] else _story_showcase(source))

    return hits


@router_search.get('/vocabulary')
async def search_vocabulary(q: str = Query(...)):
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

    return [hit['_source'] for hit in result['hits']['hits']]
