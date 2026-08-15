from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Order(Base):
    __tablename__ = 'dc_orders'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    intent: Mapped[str] = mapped_column(String, nullable=False)  # 'top_up' | 'subscription'
    # Subscription-only — split out of a single opaque target_id so activation
    # never needs to parse a packed string: plan code + billing period.
    plan_code: Mapped[str | None] = mapped_column(String, nullable=True)
    period: Mapped[str | None] = mapped_column(String, nullable=True)  # 'monthly' | 'yearly'
    base_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    expected_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default='pending')  # pending|paid|expired|cancelled
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class PaymentLog(Base):
    __tablename__ = 'dc_payment_logs'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)  # 'sms' | 'push'
    parsed_amount: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    is_incoming: Mapped[bool] = mapped_column(Boolean, nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False)  # MATCHED|IGNORED_EXPENSE|UNMATCHED|DUPLICATE
    order_id: Mapped[int | None] = mapped_column(ForeignKey('dc_orders.id'), nullable=True)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
