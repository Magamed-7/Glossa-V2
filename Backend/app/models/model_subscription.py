from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Plans(Base):
    __tablename__ = 'plans'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    price_monthly: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    price_yearly: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)

    stories_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    deck_words_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    own_stories_per_week: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ai_seconds_per_day: Mapped[int | None] = mapped_column(Integer, nullable=True)
    can_buy_stories: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    telegram_access: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)


class UserSubscriptions(Base):
    __tablename__ = 'user_subscriptions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    plan_id: Mapped[int] = mapped_column(ForeignKey('plans.id'), nullable=False, index=True)
    period: Mapped[str] = mapped_column(String, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
