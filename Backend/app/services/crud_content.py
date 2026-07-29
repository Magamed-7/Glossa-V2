from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.model_content import VocabEntries


def vocab_translation(entry: VocabEntries, locale: str):
    if locale == 'ru':
        return entry.translation_ru
    if locale == 'tg':
        return entry.translation_tg
    return None


def vocab_to_response(entry: VocabEntries, locale: str):
    return {
        'id': entry.id,
        'word': entry.word,
        'part_of_speech': entry.part_of_speech,
        'example_en': entry.example_en,
        'translation': vocab_translation(entry, locale),
        'cefr_level': entry.cefr_level,
        'unit': entry.unit,
    }


async def get_vocab_entries(db: AsyncSession, level=None, unit=None, search=None, limit=20, offset=0):
    query = select(VocabEntries)

    if level:
        query = query.where(VocabEntries.cefr_level == level)
    if unit:
        query = query.where(VocabEntries.unit == unit)
    if search:
        query = query.where(VocabEntries.word.ilike(f'%{search}%'))

    query = query.order_by(VocabEntries.word).limit(limit).offset(offset)
    result = await db.execute(query)
    return result.scalars().all()


async def get_vocab_entry(entry_id: int, db: AsyncSession):
    result = await db.execute(select(VocabEntries).where(VocabEntries.id == entry_id))
    return result.scalar_one_or_none()
