from datetime import datetime
from decimal import Decimal
from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class LingoServices(Base):
    __tablename__ = 'lingo_services'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str] = mapped_column(String, nullable=False) # e.g. KOREAN, SPANISH, FRENCH, TRANSLATION, EDITING
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    pricing_type: Mapped[str] = mapped_column(String, nullable=False, default='hr') # 'hr' or 'doc' or 'word'
    status: Mapped[str] = mapped_column(String, nullable=False, default='active') # 'active', 'draft', 'hidden'
    rating: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False, default=5.0)
    reviews_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LingoProposals(Base):
    __tablename__ = 'lingo_proposals'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    client_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    service_id: Mapped[int] = mapped_column(ForeignKey('lingo_services.id'), nullable=False, index=True)
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default='pending') # 'pending', 'active', 'completed', 'declined'
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LingoMessages(Base):
    __tablename__ = 'lingo_messages'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    proposal_id: Mapped[int] = mapped_column(ForeignKey('lingo_proposals.id'), nullable=False, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    text: Mapped[str] = mapped_column(String, nullable=False)
    file_url: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
