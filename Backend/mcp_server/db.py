from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.models import (  # noqa: F401
    model_achievement,
    model_card,
    model_content,
    model_notification,
    model_payment,
    model_profile,
    model_rating,
    model_settings,
    model_social,
    model_subscription,
    model_user,
    model_user_story,
)

engine = create_async_engine(settings.DATABASE_URL, future=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)
