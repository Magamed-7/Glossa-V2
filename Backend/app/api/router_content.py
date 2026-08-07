from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.core.errors import AppError
from app.db.database import get_db
from app.schemas.schema_content import (
    GrammarLessonDetailResponse,
    GrammarLessonResponse,
    GrammarProgressResponse,
    GrammarSubmitResult,
    QuestionSubmit,
    VocabResponse,
    WeakTopicResponse,
)
from app.services import crud_content

router_vocabulary = APIRouter(prefix='/vocabulary', tags=['Vocabulary'])
router_grammar = APIRouter(prefix='/grammar', tags=['Grammar'])


@router_vocabulary.get('/', response_model=list[VocabResponse])
async def get_vocabulary(
    level: str | None = None,
    unit: str | None = None,
    search: str | None = None,
    ids: str | None = None,
    locale: str = 'en',
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    id_list = [int(x) for x in ids.split(',')] if ids else None
    entries = await crud_content.get_vocab_entries(
        db, level=level, unit=unit, search=search, ids=id_list,
        limit=limit if id_list is None else len(id_list), offset=offset,
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


@router_grammar.get('/', response_model=list[GrammarLessonResponse])
async def get_grammar_lessons(
    level: str | None = None,
    unit: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    lessons = await crud_content.get_grammar_lessons(db, level=level, unit=unit, limit=limit, offset=offset)
    return [crud_content.lesson_to_response(lesson) for lesson in lessons]


@router_grammar.get('/progress', response_model=GrammarProgressResponse)
async def get_grammar_progress(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_content.get_grammar_progress(current_user.id, db)


@router_grammar.get('/weak-topics', response_model=list[WeakTopicResponse])
async def get_weak_topics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_content.get_weak_topics(current_user.id, db)


@router_grammar.get('/{lesson_id}', response_model=GrammarLessonDetailResponse)
async def get_grammar_lesson(
    lesson_id: int,
    locale: str = 'en',
    db: AsyncSession = Depends(get_db),
):
    detail = await crud_content.get_lesson_detail(lesson_id, locale, db)

    if detail is None:
        raise AppError(code='LESSON_NOT_FOUND', message='Grammar lesson not found', status_code=404)

    return detail


@router_grammar.post('/{lesson_id}/submit', response_model=GrammarSubmitResult)
async def submit_grammar_lesson(
    lesson_id: int,
    data: QuestionSubmit,
    locale: str = 'en',
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_content.submit_grammar_answers(lesson_id, current_user.id, data.answers, locale, db)
