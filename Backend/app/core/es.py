from elasticsearch import AsyncElasticsearch

from app.core.config import settings

es_client = AsyncElasticsearch(
    settings.ELASTICSEARCH_URL,
    basic_auth=('elastic', settings.ELASTIC_PASSWORD) if settings.ELASTIC_PASSWORD else None,
)

STORIES_INDEX = 'stories'
VOCABULARY_INDEX = 'vocabulary'

STORIES_MAPPING = {
    'properties': {
        'story_id': {'type': 'integer'},
        'title_en': {'type': 'text'},
        'title_ru': {'type': 'text'},
        'title_tg': {'type': 'text'},
        'body_en': {'type': 'text'},
        'body_ru': {'type': 'text'},
        'body_tg': {'type': 'text'},
        'genre': {'type': 'keyword'},
        'cefr_level': {'type': 'keyword'},
        'is_system': {'type': 'boolean'},
        'is_free': {'type': 'boolean'},
        'author_id': {'type': 'integer'},
        'status': {'type': 'keyword'},
    }
}

VOCABULARY_MAPPING = {
    'properties': {
        'entry_id': {'type': 'integer'},
        'word': {'type': 'text'},
        'translation_ru': {'type': 'text'},
        'translation_tg': {'type': 'text'},
        'example_en': {'type': 'text'},
        'cefr_level': {'type': 'keyword'},
        'unit': {'type': 'keyword'},
    }
}


async def ensure_indices():
    if not await es_client.indices.exists(index=STORIES_INDEX):
        await es_client.indices.create(index=STORIES_INDEX, mappings=STORIES_MAPPING)

    if not await es_client.indices.exists(index=VOCABULARY_INDEX):
        await es_client.indices.create(index=VOCABULARY_INDEX, mappings=VOCABULARY_MAPPING)
