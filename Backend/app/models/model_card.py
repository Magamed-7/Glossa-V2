from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Cards(Base):
    __tablename__ = 'cards'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    word: Mapped[str] = mapped_column(String, nullable=False)
    translation: Mapped[str] = mapped_column(String, nullable=False)
    example: Mapped[str | None] = mapped_column(String, nullable=True)
    audio_url: Mapped[str | None] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default='learning')
    source_story_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    ease_factor: Mapped[float] = mapped_column(Float, nullable=False, default=2.5)
    interval: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    repetitions: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    next_review_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_quality: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
