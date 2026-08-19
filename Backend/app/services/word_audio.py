import logging

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.storage import ALLOWED_AUDIO_TYPES, upload_file
from app.core.tts_voices import accents_for_level, pick_accent
from app.models.model_content import WordAudio
from app.services import tts

logger = logging.getLogger(__name__)


def _normalize(word: str):
    return word.strip().lower()


async def _cached_for_level(words: set[str], level: str, db: AsyncSession):
    """Audio for these words, preferring the level's accents but never refusing a hit.

    Restricting the lookup to the level's three accents used to turn a perfectly good
    recording into a miss: a word cached as en-US was invisible to a B1 learner, whose
    roster is AU/IN/CA. The reader then showed a transcription with no speaker button,
    or a button that failed once synthesis was unavailable. Accent variety is a nicety;
    hearing the word at all is the point, so anything cached is better than nothing.
    """
    if not words:
        return {}

    allowed = accents_for_level(level)
    result = await db.execute(select(WordAudio).where(WordAudio.word.in_(words)))

    preferred, spare = {}, {}
    for row in result.scalars().all():
        bucket = preferred if row.accent in allowed else spare
        bucket.setdefault(row.word, row)

    by_word = {**spare, **preferred}

    return {word: {'audio_url': row.audio_url, 'accent': row.accent} for word, row in by_word.items()}


async def _generate_one(word: str, level: str, db: AsyncSession):
    accent = pick_accent(level)

    try:
        audio_bytes, content_type = await tts.synthesize(word, accent)
    except Exception:
        logger.exception('Failed to synthesize audio for %r (%s)', word, accent)
        return None

    extension = 'mp3' if content_type == 'audio/mpeg' else 'wav'
    audio_url = upload_file('pronunciations', audio_bytes, f'{word}.{extension}', content_type, ALLOWED_AUDIO_TYPES)

    stmt = pg_insert(WordAudio).values(word=word, accent=accent, audio_url=audio_url)
    stmt = stmt.on_conflict_do_nothing(index_elements=['word', 'accent'])
    await db.execute(stmt)
    await db.commit()

    return {'audio_url': audio_url, 'accent': accent}


async def get_many_cached(words: list[str], level: str, db: AsyncSession):
    """Fast, read-only lookup — safe to call inline in a request handler."""
    normalized = {_normalize(w) for w in words if w and w.strip()}
    return await _cached_for_level(normalized, level, db)


async def generate_missing(words: list[str], level: str, db: AsyncSession):
    """Synthesizes audio for every word not already cached for this level's accents.

    Synthesis is one HTTP/TTS call per word (unlike LLM text generation, audio can't be
    batched into a single request) — always call this from a background task, never inline
    in a request handler.
    """
    normalized = {_normalize(w) for w in words if w and w.strip()}
    cached = await _cached_for_level(normalized, level, db)
    missing = normalized - cached.keys()

    for word in missing:
        generated = await _generate_one(word, level, db)
        if generated:
            cached[word] = generated

    return cached


async def level_for_user(user_id: int, db: AsyncSession):
    from app.services import crud_profile

    languages = await crud_profile.get_user_languages(user_id, db)

    for language in languages:
        if language.is_target:
            return language.level

    return 'A1'


async def get_one(word: str, level: str, db: AsyncSession):
    """Generates (or reuses cached) audio for a single word — used for a user's own added word."""
    normalized = _normalize(word)
    cached = await _cached_for_level({normalized}, level, db)

    if normalized in cached:
        return cached[normalized]

    return await _generate_one(normalized, level, db)
