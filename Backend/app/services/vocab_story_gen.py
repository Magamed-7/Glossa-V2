import json
import logging

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.model_card import Cards
from app.models.model_content import VocabEntries
from app.models.model_vocab_size_test import GeneratedStories
from app.services import llm_client

logger = logging.getLogger(__name__)

MIN_WORDS = 60
MAX_WORDS = 400
DICTIONARY_ATTEMPTS = 2

STORY_PROMPT = (
    'Write a short original English story for a language learner, about {approx_word_count} words '
    'long (a bit over or under is fine). CEFR level(s) to write for: {levels}. Naturally weave in as '
    'many of these vocabulary words as you reasonably can, without forcing them or making the text '
    'read like a word list — only include a word if it fits the story naturally:\n{word_list}\n\n'
    'Write a complete, coherent, self-contained story (has a beginning, something happening, an '
    'ending) appropriate for the given CEFR level(s) — simple grammar and vocabulary for A1-A2, more '
    'natural complexity for B1+. Respond with a single JSON object and nothing else, in exactly this '
    'shape: {{"title": "short title", "body": "the full story text"}}.'
)


async def _candidate_words(user_id: int, levels: list[str], word_status: str, db: AsyncSession):
    query = select(Cards.word).where(Cards.user_id == user_id)
    if word_status and word_status != 'all':
        query = query.where(Cards.status == word_status)

    deck_words = {w.lower() for w in (await db.execute(query)).scalars().all()}
    if not deck_words:
        return []

    if not levels:
        return sorted(deck_words)[:60]

    vocab_result = await db.execute(
        select(func.lower(VocabEntries.word)).where(VocabEntries.cefr_level.in_(levels))
    )
    level_word_set = {row[0] for row in vocab_result.all()}

    matched = [w for w in deck_words if w in level_word_set]
    return sorted(matched)[:60] if matched else sorted(deck_words)[:60]


def _strip_code_fence(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith('```json'):
        raw = raw[len('```json'):]
    elif raw.startswith('```'):
        raw = raw[len('```'):]
    if raw.endswith('```'):
        raw = raw[:-len('```')]
    return raw.strip()


async def _build_word_dictionary(body: str):
    from app.tasks.ai import GENERATE_STORY_DICTIONARY_PROMPT, _chunk_words

    dictionary_data = {}
    for chunk in _chunk_words(body):
        prompt = GENERATE_STORY_DICTIONARY_PROMPT.format(text=chunk)
        for attempt in range(DICTIONARY_ATTEMPTS):
            try:
                raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
                parsed = json.loads(_strip_code_fence(raw))
            except Exception:
                logger.exception('Word dictionary chunk failed for generated story (attempt %s)', attempt + 1)
                continue
            dictionary_data.update(parsed)
            break

    return dictionary_data


async def generate(user_id: int, levels: list[str], word_status: str, approx_word_count: int, db: AsyncSession):
    approx_word_count = max(MIN_WORDS, min(MAX_WORDS, approx_word_count))
    words = await _candidate_words(user_id, levels, word_status, db)

    prompt = STORY_PROMPT.format(
        approx_word_count=approx_word_count,
        levels=', '.join(levels) if levels else 'A2-B1 (default)',
        word_list=', '.join(words) if words else '(no specific words available — write a general story at this level)',
    )

    try:
        raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
        data = json.loads(_strip_code_fence(raw))
        body = data['body']
    except Exception:
        logger.exception('Story generation failed for user %s', user_id)
        raise AppError(code='GENERATION_FAILED', message='Could not generate a story right now, try again', status_code=502)

    word_dictionary = await _build_word_dictionary(body)

    story = GeneratedStories(
        user_id=user_id,
        body=body,
        word_dictionary=word_dictionary,
        cefr_levels=levels or [],
        approx_word_count=approx_word_count,
    )
    db.add(story)
    await db.commit()
    await db.refresh(story)
    return story


async def get_story(story_id: int, user_id: int, db: AsyncSession):
    result = await db.execute(
        select(GeneratedStories).where(GeneratedStories.id == story_id, GeneratedStories.user_id == user_id)
    )
    story = result.scalar_one_or_none()
    if story is None:
        raise AppError(code='STORY_NOT_FOUND', message='Generated story not found', status_code=404)
    return story


async def list_my_stories(user_id: int, db: AsyncSession, limit: int = 20, offset: int = 0):
    result = await db.execute(
        select(GeneratedStories)
        .where(GeneratedStories.user_id == user_id)
        .order_by(GeneratedStories.id.desc())
        .limit(limit)
        .offset(offset)
    )
    return result.scalars().all()
