from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_content import VocabResponse
from app.services import crud_content

router_vocabulary = APIRouter(prefix='/vocabulary', tags=['Vocabulary'])


@router_vocabulary.get('/', response_model=list[VocabResponse])
async def get_vocabulary(
    level: str | None = None,
    unit: str | None = None,
    search: str | None = None,
    locale: str = 'en',
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    entries = await crud_content.get_vocab_entries(
        db, level=level, unit=unit, search=search, limit=limit, offset=offset
    )
    return [crud_content.vocab_to_response(entry, locale) for entry in entries]


@router_vocabulary.get('/{entry_id}', response_model=VocabResponse)
async def get_vocab_entry(
    entry_id: int,
    locale: str = 'en',
    db: AsyncSession = Depends(get_db),
):
    entry = await crud_content.get_vocab_entry(entry_id, db)

    if entry is None:
        raise AppError(code='VOCAB_ENTRY_NOT_FOUND', message='Vocabulary entry not found', status_code=404)

    return crud_content.vocab_to_response(entry, locale)
