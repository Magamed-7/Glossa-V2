from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class UserSettings(Base):
    __tablename__ = 'user_settings'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, unique=True, index=True)

    target_language: Mapped[str | None] = mapped_column(String, nullable=True)
    interface_language: Mapped[str] = mapped_column(String, nullable=False, default='en')
    daily_goal: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    study_time: Mapped[str | None] = mapped_column(String, nullable=True)
    difficulty: Mapped[str] = mapped_column(String, nullable=False, default='medium')

    email_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    push_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    telegram_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    reminder_time: Mapped[str | None] = mapped_column(String, nullable=True)

    ratings_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    profile_visible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    telegram_language: Mapped[str | None] = mapped_column(String, nullable=True)
    telegram_sm2_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
