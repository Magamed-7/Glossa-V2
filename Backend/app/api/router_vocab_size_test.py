from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_vocab_size_test import (
    VocabSizeTestConfirmRequest,
    VocabSizeTestConfirmResponse,
    VocabSizeTestStartResponse,
    VocabSizeTestSubmitRequest,
    VocabSizeTestSubmitResponse,
)
from app.services import vocab_size_test

router_vocab_size_test = APIRouter(prefix='/tests/vocab-size', tags=['Vocabulary Size Test'])


@router_vocab_size_test.post('/start', response_model=VocabSizeTestStartResponse)
async def start_test(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    attempt_id, items = await vocab_size_test.start_test(current_user.id, db)
    return {'attempt_id': attempt_id, 'items': items}


@router_vocab_size_test.post('/{attempt_id}/submit', response_model=VocabSizeTestSubmitResponse)
async def submit_test(
    attempt_id: int,
    data: VocabSizeTestSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await vocab_size_test.submit_test(current_user.id, attempt_id, data.known_ids, db)


@router_vocab_size_test.post('/{attempt_id}/confirm', response_model=VocabSizeTestConfirmResponse)
async def confirm_result(
    attempt_id: int,
    data: VocabSizeTestConfirmRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await vocab_size_test.confirm_result(current_user.id, attempt_id, data.accepted, data.adjusted_total, db)
