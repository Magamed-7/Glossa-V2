from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.auth import get_current_user
from app.db.database import get_db
from app.schemas.schema_subscription import MySubscriptionResponse, PlanResponse, SubscribeRequest
from app.services import crud_subscription

router_subscription = APIRouter(prefix='/subscriptions', tags=['Subscriptions'])


@router_subscription.get('/plans', response_model=list[PlanResponse])
async def get_plans(db: AsyncSession = Depends(get_db)):
    return await crud_subscription.get_plans(db)


@router_subscription.get('/my', response_model=MySubscriptionResponse)
async def get_my_subscription(
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_subscription.get_active_subscription(current_user.id, db)


@router_subscription.post('/subscribe', response_model=MySubscriptionResponse)
async def subscribe(
    data: SubscribeRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return await crud_subscription.subscribe_to_plan(current_user.id, data.plan_code, data.period, db)
