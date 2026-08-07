from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import json

from app.api.auth import get_current_user
from app.db.database import get_db
from app.models.model_user import Users
from app.models.model_profile import UserProfiles
from app.models.model_lingo import LingoServices
from app.schemas.schema_lingo import (
    LingoServiceCreate,
    LingoServiceUpdate,
    LingoServiceResponse,
    LingoProposalCreate,
    LingoProposalResponse,
    LingoProposalAction,
    LingoMessageCreate,
    LingoMessageResponse,
    LingoAnalyticsResponse,
    LingoTranslateRequest,
    LingoTranslateResponse
)
from app.services import crud_lingo
from app.services.crud_subscription import get_active_subscription
from app.core.limits import get_daily, incr_daily
from app.services.llm_client import call_llm

router_lingo = APIRouter(prefix='/lingo', tags=['Lingo Marketplace'])


async def _get_provider_info(provider_id: int, db: AsyncSession):
    query = (
        select(Users.username, UserProfiles.photo_url)
        .select_from(Users)
        .outerjoin(UserProfiles, UserProfiles.user_id == Users.id)
        .where(Users.id == provider_id)
    )
    row = (await db.execute(query)).first()
    return (row.username, row.photo_url) if row else (None, None)


@router_lingo.post('/services', response_model=LingoServiceResponse)
async def create_service(
    data: LingoServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = await crud_lingo.create_lingo_service(data, current_user.id, db)
    _, provider_photo_url = await _get_provider_info(service.provider_id, db)
    return LingoServiceResponse(
        id=service.id,
        provider_id=service.provider_id,
        provider_name=current_user.username,
        provider_photo_url=provider_photo_url,
        title=service.title,
        description=service.description,
        title_en=service.title_en,
        title_ru=service.title_ru,
        title_tg=service.title_tg,
        description_en=service.description_en,
        description_ru=service.description_ru,
        description_tg=service.description_tg,
        category=service.category,
        cefr_level=service.cefr_level,
        price=service.price,
        pricing_type=service.pricing_type,
        status=service.status,
        rating=float(service.rating),
        reviews_count=service.reviews_count,
        created_at=service.created_at
    )


@router_lingo.get('/services', response_model=list[LingoServiceResponse])
async def list_services(
    category: str | None = None,
    cefr_group: str | None = None,
    price_group: str | None = None,
    provider_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    services = await crud_lingo.get_lingo_services(
        db, category, cefr_group, price_group, provider_id
    )
    
    res = []
    for s in services:
        prov_name, prov_photo_url = await _get_provider_info(s.provider_id, db)
        res.append(
            LingoServiceResponse(
                id=s.id,
                provider_id=s.provider_id,
                provider_name=prov_name,
                provider_photo_url=prov_photo_url,
                title=s.title,
                description=s.description,
                title_en=s.title_en,
                title_ru=s.title_ru,
                title_tg=s.title_tg,
                description_en=s.description_en,
                description_ru=s.description_ru,
                description_tg=s.description_tg,
                category=s.category,
                cefr_level=s.cefr_level,
                price=s.price,
                pricing_type=s.pricing_type,
                status=s.status,
                rating=float(s.rating),
                reviews_count=s.reviews_count,
                created_at=s.created_at
            )
        )
    return res


@router_lingo.get('/services/{id}', response_model=LingoServiceResponse)
async def get_service(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    s = await crud_lingo.get_lingo_service(id, db)
    prov_name, prov_photo_url = await _get_provider_info(s.provider_id, db)
    return LingoServiceResponse(
        id=s.id,
        provider_id=s.provider_id,
        provider_name=prov_name,
        provider_photo_url=prov_photo_url,
        title=s.title,
        description=s.description,
        title_en=s.title_en,
        title_ru=s.title_ru,
        title_tg=s.title_tg,
        description_en=s.description_en,
        description_ru=s.description_ru,
        description_tg=s.description_tg,
        category=s.category,
        cefr_level=s.cefr_level,
        price=s.price,
        pricing_type=s.pricing_type,
        status=s.status,
        rating=float(s.rating),
        reviews_count=s.reviews_count,
        created_at=s.created_at
    )


@router_lingo.patch('/services/{id}', response_model=LingoServiceResponse)
async def update_service(
    id: int,
    data: LingoServiceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    s = await crud_lingo.update_lingo_service(id, current_user.id, data, db)
    prov_name, prov_photo_url = await _get_provider_info(s.provider_id, db)
    return LingoServiceResponse(
        id=s.id,
        provider_id=s.provider_id,
        provider_name=prov_name,
        provider_photo_url=prov_photo_url,
        title=s.title,
        description=s.description,
        title_en=s.title_en,
        title_ru=s.title_ru,
        title_tg=s.title_tg,
        description_en=s.description_en,
        description_ru=s.description_ru,
        description_tg=s.description_tg,
        category=s.category,
        cefr_level=s.cefr_level,
        price=s.price,
        pricing_type=s.pricing_type,
        status=s.status,
        rating=float(s.rating),
        reviews_count=s.reviews_count,
        created_at=s.created_at
    )


@router_lingo.post('/proposals', response_model=LingoProposalResponse)
async def create_proposal(
    data: LingoProposalCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    p = await crud_lingo.create_lingo_proposal(data, current_user.id, db)
    
    client_name = current_user.username
    prov_query = await db.execute(select(Users.username).where(Users.id == p.provider_id))
    provider_name = prov_query.scalar_one_or_none()
    
    svc_query = await db.execute(select(LingoServices).where(LingoServices.id == p.service_id))
    svc = svc_query.scalar_one_or_none()
    
    return LingoProposalResponse(
        id=p.id,
        client_id=p.client_id,
        client_name=client_name,
        provider_id=p.provider_id,
        provider_name=provider_name,
        service_id=p.service_id,
        service_title=svc.title if svc else None,
        service_title_en=svc.title_en if svc else None,
        service_title_ru=svc.title_ru if svc else None,
        service_title_tg=svc.title_tg if svc else None,
        service_category=svc.category if svc else None,
        price=p.price,
        status=p.status,
        created_at=p.created_at
    )


@router_lingo.get('/proposals', response_model=list[LingoProposalResponse])
async def list_proposals(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    proposals = await crud_lingo.get_lingo_proposals(current_user.id, db)
    
    res = []
    for p in proposals:
        cli_query = await db.execute(select(Users.username).where(Users.id == p.client_id))
        cli_name = cli_query.scalar_one_or_none()
        
        prov_query = await db.execute(select(Users.username).where(Users.id == p.provider_id))
        prov_name = prov_query.scalar_one_or_none()
        
        svc_query = await db.execute(select(LingoServices).where(LingoServices.id == p.service_id))
        svc = svc_query.scalar_one_or_none()
        
        res.append(
            LingoProposalResponse(
                id=p.id,
                client_id=p.client_id,
                client_name=cli_name,
                provider_id=p.provider_id,
                provider_name=prov_name,
                service_id=p.service_id,
                service_title=svc.title if svc else None,
                service_title_en=svc.title_en if svc else None,
                service_title_ru=svc.title_ru if svc else None,
                service_title_tg=svc.title_tg if svc else None,
                service_category=svc.category if svc else None,
                price=p.price,
                status=p.status,
                created_at=p.created_at
            )
        )
    return res


@router_lingo.post('/proposals/{id}/action', response_model=LingoProposalResponse)
async def proposal_action(
    id: int,
    data: LingoProposalAction,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    p = await crud_lingo.perform_proposal_action(id, current_user.id, data.action, db)
    
    cli_query = await db.execute(select(Users.username).where(Users.id == p.client_id))
    cli_name = cli_query.scalar_one_or_none()
    
    prov_query = await db.execute(select(Users.username).where(Users.id == p.provider_id))
    prov_name = prov_query.scalar_one_or_none()
    
    svc_query = await db.execute(select(LingoServices).where(LingoServices.id == p.service_id))
    svc = svc_query.scalar_one_or_none()
    
    return LingoProposalResponse(
        id=p.id,
        client_id=p.client_id,
        client_name=cli_name,
        provider_id=p.provider_id,
        provider_name=prov_name,
        service_id=p.service_id,
        service_title=svc.title if svc else None,
        service_title_en=svc.title_en if svc else None,
        service_title_ru=svc.title_ru if svc else None,
        service_title_tg=svc.title_tg if svc else None,
        service_category=svc.category if svc else None,
        price=p.price,
        status=p.status,
        created_at=p.created_at
    )


@router_lingo.get('/proposals/{id}/messages', response_model=list[LingoMessageResponse])
async def list_messages(
    id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    messages = await crud_lingo.get_lingo_messages(id, current_user.id, db)
    
    res = []
    for m in messages:
        sender_query = await db.execute(select(Users.username).where(Users.id == m.sender_id))
        sender_name = sender_query.scalar_one_or_none()
        res.append(
            LingoMessageResponse(
                id=m.id,
                proposal_id=m.proposal_id,
                sender_id=m.sender_id,
                sender_name=sender_name,
                text=m.text,
                file_url=m.file_url,
                created_at=m.created_at
            )
        )
    return res


@router_lingo.post('/proposals/{id}/messages', response_model=LingoMessageResponse)
async def send_message(
    id: int,
    data: LingoMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    m = await crud_lingo.create_lingo_message(id, current_user.id, data, db)
    return LingoMessageResponse(
        id=m.id,
        proposal_id=m.proposal_id,
        sender_id=m.sender_id,
        sender_name=current_user.username,
        text=m.text,
        file_url=m.file_url,
        created_at=m.created_at
    )


@router_lingo.get('/analytics', response_model=LingoAnalyticsResponse)
async def get_analytics(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    return await crud_lingo.get_lingo_analytics(current_user.id, db)


@router_lingo.post('/ai-translate', response_model=LingoTranslateResponse)
async def ai_translate(
    data: LingoTranslateRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    # 1. Fetch user subscription details
    sub = await get_active_subscription(current_user.id, db)
    plan_code = sub['plan'].code if sub else 'free'

    # 2. Gate check: Free tier is forbidden
    if plan_code == 'free':
        raise HTTPException(
            status_code=403,
            detail="AI Auto-translate is not available on the Free plan. Upgrade to access."
        )

    # 3. Check level 2 (premium) daily limit — pro is the top tier and stays unlimited
    limit = 15 if plan_code == 'premium' else None
    daily_usage = await get_daily(current_user.id, 'ai_translate')

    if limit is not None and daily_usage >= limit:
        raise HTTPException(
            status_code=403,
            detail="Daily AI Translation limit reached. Upgrade to Level 3 for infinite translations."
        )

    # 4. Invoke LLM client to translate
    system_prompt = (
        "You are an expert translator. Translate the given Title and Description into Russian, English, and Tajik. "
        "Return the output strictly in JSON format matching this schema: "
        "{\"title_translations\": {\"ru\": \"...\", \"en\": \"...\", \"tg\": \"...\"}, "
        "\"description_translations\": {\"ru\": \"...\", \"en\": \"...\", \"tg\": \"...\"}}. "
        "Do not include any extra text, codeblocks or markdown formatting."
    )
    user_prompt = f"Title:\n{data.title}\n\nDescription:\n{data.description}"

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        response_content = await call_llm(messages, json_mode=True)
        translation_result = json.loads(response_content)
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"AI translation service error: {str(exc)}"
        )

    # 5. Increment daily count for pro plan users
    if limit is not None:
        daily_usage = await incr_daily(current_user.id, 'ai_translate')
    else:
        # Just increment for stats tracking
        await incr_daily(current_user.id, 'ai_translate')
        daily_usage += 1

    return LingoTranslateResponse(
        title_translations=translation_result.get("title_translations", {}),
        description_translations=translation_result.get("description_translations", {}),
        daily_count=daily_usage,
        daily_limit=limit
    )
