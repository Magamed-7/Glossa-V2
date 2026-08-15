from datetime import datetime

from sqlalchemy import JSON, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class VocabSizeTestAttempts(Base):
    __tablename__ = 'vocab_size_test_attempts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    items_snapshot: Mapped[dict] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=False)
    status: Mapped[str] = mapped_column(String, nullable=False, default='ready')
    by_level: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    estimated_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    confirmed_total: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class GeneratedStories(Base):
    __tablename__ = 'generated_stories'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    body: Mapped[str] = mapped_column(String, nullable=False)
    word_dictionary: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    cefr_levels: Mapped[list] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=False)
    approx_word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
