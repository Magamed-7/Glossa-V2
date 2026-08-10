import json
import logging

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import WordTranscriptions
from app.services import llm_client

logger = logging.getLogger(__name__)

BATCH_SIZE = 50

TRANSCRIPTION_PROMPT = (
    'You are a phonetics expert building IPA transcriptions for an English learner\'s '
    'dictionary. For each of the following English words or short phrases, give its IPA '
    'transcription using General American pronunciation, broad/phonemic style, with a '
    'primary stress mark (ˈ) where it applies. Do not include slashes or brackets — '
    'just the bare IPA symbols. If a word is a short phrase, transcribe it naturally as '
    'a whole, word by word.\n\n'
    'Words:\n{words}\n\n'
    'Respond ONLY with a single JSON object mapping each word exactly as given above to '
    'its IPA transcription string, nothing else. Example: {{"hello": "həˈloʊ", '
    '"take off": "ˈteɪk ɔf"}}.'
)


def _normalize(word: str):
    return word.strip().lower()


async def _cached(words: set[str], db: AsyncSession):
    if not words:
        return {}

    result = await db.execute(select(WordTranscriptions).where(WordTranscriptions.word.in_(words)))
    return {row.word: row.transcription for row in result.scalars().all()}


async def _generate_batch(words: list[str], db: AsyncSession):
    prompt = TRANSCRIPTION_PROMPT.format(words='\n'.join(f'- {w}' for w in words))

    try:
        raw = await llm_client.call_llm([{'role': 'user', 'content': prompt}])
        data = json.loads(raw)
    except Exception:
        logger.exception('Failed to generate transcriptions for batch of %s words', len(words))
        return {}

    generated = {
        _normalize(word): str(transcription).strip()
        for word, transcription in data.items()
        if str(transcription).strip()
    }

    if not generated:
        return {}

    for word, transcription in generated.items():
        stmt = pg_insert(WordTranscriptions).values(word=word, transcription=transcription)
        stmt = stmt.on_conflict_do_nothing(index_elements=['word'])
        await db.execute(stmt)

    await db.commit()
    return generated


async def get_many(words: list[str], db: AsyncSession):
    normalized = {_normalize(w) for w in words if w and w.strip()}
    result = await _cached(normalized, db)

    missing = [w for w in normalized if w not in result]
    for i in range(0, len(missing), BATCH_SIZE):
        chunk = missing[i:i + BATCH_SIZE]
        result.update(await _generate_batch(chunk, db))

    return result


async def get_one(word: str, db: AsyncSession):
    result = await get_many([word], db)
    return result.get(_normalize(word))
