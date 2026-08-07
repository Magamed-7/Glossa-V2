from decimal import Decimal
from sqlalchemy import select, update, and_, or_, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.model_lingo import LingoServices, LingoProposals, LingoMessages
from app.models.model_user import Users
from app.models.model_payment import UserBalances, Purchases
from app.schemas.schema_lingo import (
    LingoServiceCreate,
    LingoServiceUpdate,
    LingoProposalCreate,
    LingoMessageCreate
)
from app.core.errors import AppError


async def create_lingo_service(data: LingoServiceCreate, provider_id: int, db: AsyncSession) -> LingoServices:
    service = LingoServices(
        provider_id=provider_id,
        title=data.title,
        description=data.description,
        category=data.category,
        cefr_level=data.cefr_level,
        price=data.price,
        pricing_type=data.pricing_type,
        status=data.status
    )
    db.add(service)
    await db.commit()
    await db.refresh(service)
    return service


async def get_lingo_services(
    db: AsyncSession,
    category: str | None = None,
    cefr_group: str | None = None, # 'A1-A2', 'B1-B2', 'C1-C2' or 'ALL'
    price_group: str | None = None, # 'free', 'under50', '50-150', 'premium150'
    provider_id: int | None = None
) -> list[LingoServices]:
    query = select(LingoServices).where(LingoServices.status == 'active')

    if provider_id is not None:
        # If looking at provider listings, we can show drafts and hidden ones too
        query = select(LingoServices).where(LingoServices.provider_id == provider_id)

    if category:
        query = query.where(LingoServices.category == category)

    if cefr_group and cefr_group != 'ALL':
        levels = cefr_group.split('-')
        query = query.where(LingoServices.cefr_level.in_(levels))

    if price_group:
        if price_group == 'free':
            query = query.where(LingoServices.price == 0)
        elif price_group == 'under50':
            query = query.where(and_(LingoServices.price > 0, LingoServices.price < 50))
        elif price_group == '50-150':
            query = query.where(and_(LingoServices.price >= 50, LingoServices.price <= 150))
        elif price_group == 'premium150':
            query = query.where(LingoServices.price > 150)

    # Order by rating and created date
    query = query.order_by(LingoServices.rating.desc(), LingoServices.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_lingo_service(service_id: int, db: AsyncSession) -> LingoServices:
    query = select(LingoServices).where(LingoServices.id == service_id)
    result = await db.execute(query)
    service = result.scalar_one_or_none()
    if not service:
        raise AppError(code='SERVICE_NOT_FOUND', message='Lingo service not found', status_code=404)
    return service


async def update_lingo_service(service_id: int, provider_id: int, data: LingoServiceUpdate, db: AsyncSession) -> LingoServices:
    service = await get_lingo_service(service_id, db)
    if service.provider_id != provider_id:
        raise AppError(code='FORBIDDEN', message='You do not own this service listing', status_code=403)

    for field, val in data.model_dump(exclude_unset=True).items():
        setattr(service, field, val)

    await db.commit()
    await db.refresh(service)
    return service


async def create_lingo_proposal(data: LingoProposalCreate, client_id: int, db: AsyncSession) -> LingoProposals:
    service = await get_lingo_service(data.service_id, db)
    if service.provider_id == client_id:
        raise AppError(code='BAD_REQUEST', message='You cannot order your own service', status_code=400)

    # Check if active proposal already exists to prevent duplicate pending negotiations
    existing = await db.execute(
        select(LingoProposals).where(
            and_(
                LingoProposals.client_id == client_id,
                LingoProposals.service_id == data.service_id,
                LingoProposals.status == 'pending'
            )
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise AppError(code='PROPOSAL_ALREADY_EXISTS', message='You already have a pending proposal for this service', status_code=400)

    proposal = LingoProposals(
        client_id=client_id,
        provider_id=service.provider_id,
        service_id=data.service_id,
        price=data.price
    )
    db.add(proposal)
    await db.commit()
    await db.refresh(proposal)

    # Create initial timeline message
    welcome_message = LingoMessages(
        proposal_id=proposal.id,
        sender_id=client_id,
        text=f"Начало переговоров по услуге: '{service.title}' по цене {proposal.price} TJS."
    )
    db.add(welcome_message)
    await db.commit()

    return proposal


async def get_lingo_proposal(proposal_id: int, db: AsyncSession) -> LingoProposals:
    query = select(LingoProposals).where(LingoProposals.id == proposal_id)
    result = await db.execute(query)
    proposal = result.scalar_one_or_none()
    if not proposal:
        raise AppError(code='PROPOSAL_NOT_FOUND', message='Proposal not found', status_code=404)
    return proposal


async def get_lingo_proposals(user_id: int, db: AsyncSession) -> list[LingoProposals]:
    # Show proposals where user is either client or provider
    query = select(LingoProposals).where(
        or_(
            LingoProposals.client_id == user_id,
            LingoProposals.provider_id == user_id
        )
    ).order_by(LingoProposals.created_at.desc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def perform_proposal_action(proposal_id: int, user_id: int, action: str, db: AsyncSession) -> LingoProposals:
    proposal = await get_lingo_proposal(proposal_id, db)
    
    if action == 'decline':
        # Either provider or client can decline/cancel proposal
        if user_id not in (proposal.client_id, proposal.provider_id):
            raise AppError(code='FORBIDDEN', message='Not authorized to decline this proposal', status_code=403)
        proposal.status = 'declined'
        msg = LingoMessages(
            proposal_id=proposal.id,
            sender_id=user_id,
            text="Сделка отклонена/отменена."
        )
        db.add(msg)
        await db.commit()
        await db.refresh(proposal)
        return proposal

    elif action == 'confirm':
        # Confirm & Pay: Только клиент может подтвердить/оплатить выставленное предложение
        if user_id != proposal.client_id:
            raise AppError(code='FORBIDDEN', message='Only the client can confirm and pay the proposal', status_code=403)
        if proposal.status != 'pending':
            raise AppError(code='INVALID_STATUS', message='Proposal is not in pending status', status_code=400)

        # Process billing / wallet deduction
        balance_query = await db.execute(select(UserBalances).where(UserBalances.user_id == client_id_helper := proposal.client_id))
        user_balance = balance_query.scalar_one_or_none()

        if not user_balance or user_balance.balance < proposal.price:
            raise AppError(code='INSUFFICIENT_FUNDS', message='Insufficient funds in your wallet to confirm this proposal', status_code=400)

        # Deduct client balance
        user_balance.balance -= proposal.price

        # Add seller balance (90/10 split? or direct payout? Let's credit the provider's wallet with the amount minus 10% platform fee)
        provider_balance_query = await db.execute(select(UserBalances).where(UserBalances.user_id == proposal.provider_id))
        provider_balance = provider_balance_query.scalar_one_or_none()
        if not provider_balance:
            provider_balance = UserBalances(user_id=proposal.provider_id, balance=Decimal('0.00'))
            db.add(provider_balance)

        platform_fee_ratio = Decimal('0.10') # 10% standard fee
        provider_income = proposal.price * (Decimal('1.00') - platform_fee_ratio)
        provider_balance.balance += provider_income

        # Record purchases logs
        purchase = Purchases(
            buyer_id=proposal.client_id,
            item_type='lingo_service',
            item_id=proposal.service_id,
            amount=proposal.price,
            seller_id=proposal.provider_id,
            seller_income=provider_income
        )
        db.add(purchase)

        # Update proposal status to active (in progress / paid)
        proposal.status = 'active'

        msg = LingoMessages(
            proposal_id=proposal.id,
            sender_id=user_id,
            text=f"Оплата произведена! Контракт активен. {proposal.price} TJS списано с вашего баланса."
        )
        db.add(msg)
        await db.commit()
        await db.refresh(proposal)
        return proposal

    return proposal


async def create_lingo_message(proposal_id: int, sender_id: int, data: LingoMessageCreate, db: AsyncSession) -> LingoMessages:
    proposal = await get_lingo_proposal(proposal_id, db)
    if sender_id not in (proposal.client_id, proposal.provider_id):
        raise AppError(code='FORBIDDEN', message='You are not a participant in this conversation', status_code=403)

    message = LingoMessages(
        proposal_id=proposal_id,
        sender_id=sender_id,
        text=data.text,
        file_url=data.file_url
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


async def get_lingo_messages(proposal_id: int, user_id: int, db: AsyncSession) -> list[LingoMessages]:
    proposal = await get_lingo_proposal(proposal_id, db)
    if user_id not in (proposal.client_id, proposal.provider_id):
        raise AppError(code='FORBIDDEN', message='You are not a participant in this conversation', status_code=403)

    query = select(LingoMessages).where(LingoMessages.proposal_id == proposal_id).order_by(LingoMessages.created_at.asc())
    result = await db.execute(query)
    return list(result.scalars().all())


async def get_lingo_analytics(provider_id: int, db: AsyncSession) -> dict:
    # 1. Total Earnings (Sum of amount paid to provider in purchases where seller_id is provider_id)
    earnings_query = await db.execute(
        select(func.sum(Purchases.seller_income)).where(Purchases.seller_id == provider_id)
    )
    total_earnings = earnings_query.scalar() or Decimal('0.00')

    # 2. Active Jobs count (number of proposals with active status)
    active_jobs_query = await db.execute(
        select(func.count(LingoProposals.id)).where(
            and_(LingoProposals.provider_id == provider_id, LingoProposals.status == 'active')
        )
    )
    active_jobs = active_jobs_query.scalar() or 0

    # 3. Average rating of listings owned by this provider
    rating_query = await db.execute(
        select(func.avg(LingoServices.rating)).where(LingoServices.provider_id == provider_id)
    )
    avg_rating = rating_query.scalar() or 5.0

    # 4. Top services (with percentage contribution based on sales count)
    services_query = await db.execute(
        select(
            LingoServices.title,
            LingoServices.category,
            func.count(Purchases.id)
        )
        .join(Purchases, Purchases.item_id == LingoServices.id)
        .where(LingoServices.provider_id == provider_id)
        .group_by(LingoServices.id)
    )
    raw_services = services_query.all()
    total_sales = sum(s[2] for s in raw_services) if raw_services else 0

    top_services = []
    for title, cat, cnt in raw_services:
        top_services.append({
            'title': title,
            'percentage': round((cnt / total_sales) * 100, 1) if total_sales > 0 else 0.0,
            'category': cat
        })

    # Default mockup top service if nothing sold yet
    if not top_services:
        top_services = [
            {'title': 'Technical Translation (EN->ES)', 'percentage': 45.0, 'category': 'TRANSLATION'},
            {'title': 'Document Review', 'percentage': 30.0, 'category': 'EDITING'},
            {'title': 'Live Interpreting', 'percentage': 25.0, 'category': 'VIRTUAL'}
        ]

    # 5. Revenue history (Mocked bar chart data)
    revenue_history = [
        {'month': 'Jan', 'amount': Decimal('450.00')},
        {'month': 'Feb', 'amount': Decimal('600.00')},
        {'month': 'Mar', 'amount': Decimal('800.00')},
        {'month': 'Apr', 'amount': Decimal('1100.00')},
        {'month': 'May', 'amount': Decimal('900.00')},
        {'month': 'Jun', 'amount': Decimal('1000.00')}
    ]

    return {
        'total_earnings': total_earnings,
        'active_jobs': active_jobs,
        'average_rating': float(avg_rating),
        'top_services': top_services,
        'revenue_history': revenue_history
    }
