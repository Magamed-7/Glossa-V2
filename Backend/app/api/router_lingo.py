from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.api.auth import get_current_user
from app.db.database import get_db
from app.models.model_user import Users
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
    LingoAnalyticsResponse
)
from app.services import crud_lingo

router_lingo = APIRouter(prefix='/lingo', tags=['Lingo Marketplace'])


@router_lingo.post('/services', response_model=LingoServiceResponse)
async def create_service(
    data: LingoServiceCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user)
):
    service = await crud_lingo.create_lingo_service(data, current_user.id, db)
    # Return response with provider name loaded
    return LingoServiceResponse(
        id=service.id,
        provider_id=service.provider_id,
        provider_name=current_user.username,
        title=service.title,
        description=service.description,
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
    
    # Load provider names
    res = []
    for s in services:
        provider_query = await db.execute(select(Users.username).where(Users.id == s.provider_id))
        prov_name = provider_query.scalar_one_or_none()
        res.append(
            LingoServiceResponse(
                id=s.id,
                provider_id=s.provider_id,
                provider_name=prov_name,
                title=s.title,
                description=s.description,
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
    provider_query = await db.execute(select(Users.username).where(Users.id == s.provider_id))
    prov_name = provider_query.scalar_one_or_none()
    return LingoServiceResponse(
        id=s.id,
        provider_id=s.provider_id,
        provider_name=prov_name,
        title=s.title,
        description=s.description,
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
    provider_query = await db.execute(select(Users.username).where(Users.id == s.provider_id))
    prov_name = provider_query.scalar_one_or_none()
    return LingoServiceResponse(
        id=s.id,
        provider_id=s.provider_id,
        provider_name=prov_name,
        title=s.title,
        description=s.description,
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
