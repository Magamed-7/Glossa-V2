from datetime import datetime
from decimal import Decimal
from typing import Literal
from pydantic import BaseModel, ConfigDict


class LingoServiceCreate(BaseModel):
    title: str
    description: str
    title_en: str | None = None
    title_ru: str | None = None
    title_tg: str | None = None
    description_en: str | None = None
    description_ru: str | None = None
    description_tg: str | None = None
    category: str
    cefr_level: str | None = None
    price: Decimal
    pricing_type: Literal['hr', 'doc', 'word'] = 'hr'
    status: Literal['active', 'draft', 'hidden'] = 'active'


class LingoServiceUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    title_en: str | None = None
    title_ru: str | None = None
    title_tg: str | None = None
    description_en: str | None = None
    description_ru: str | None = None
    description_tg: str | None = None
    category: str | None = None
    cefr_level: str | None = None
    price: Decimal | None = None
    pricing_type: Literal['hr', 'doc', 'word'] | None = None
    status: Literal['active', 'draft', 'hidden'] | None = None


class LingoServiceResponse(BaseModel):
    id: int
    provider_id: int
    provider_name: str | None = None
    provider_photo_url: str | None = None
    title: str
    description: str
    title_en: str | None = None
    title_ru: str | None = None
    title_tg: str | None = None
    description_en: str | None = None
    description_ru: str | None = None
    description_tg: str | None = None
    category: str
    cefr_level: str | None = None
    price: Decimal
    pricing_type: str
    status: str
    rating: float
    reviews_count: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LingoProposalCreate(BaseModel):
    service_id: int
    price: Decimal


class LingoProposalResponse(BaseModel):
    id: int
    client_id: int
    client_name: str | None = None
    provider_id: int
    provider_name: str | None = None
    service_id: int
    service_title: str | None = None
    service_title_en: str | None = None
    service_title_ru: str | None = None
    service_title_tg: str | None = None
    service_category: str | None = None
    price: Decimal
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LingoProposalAction(BaseModel):
    action: Literal['confirm', 'decline']


class LingoMessageCreate(BaseModel):
    text: str
    file_url: str | None = None


class LingoMessageResponse(BaseModel):
    id: int
    proposal_id: int
    sender_id: int
    sender_name: str | None = None
    text: str
    file_url: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class RevenueMonthItem(BaseModel):
    month: str
    amount: Decimal


class TopServiceItem(BaseModel):
    title: str
    percentage: float
    category: str


class LingoAnalyticsResponse(BaseModel):
    total_earnings: Decimal
    active_jobs: int
    average_rating: float
    top_services: list[TopServiceItem]
    revenue_history: list[RevenueMonthItem]


class LingoTranslateRequest(BaseModel):
    title: str
    description: str


class LingoTranslateResponse(BaseModel):
    title_translations: dict[str, str]
    description_translations: dict[str, str]
    daily_count: int
    daily_limit: int | None

