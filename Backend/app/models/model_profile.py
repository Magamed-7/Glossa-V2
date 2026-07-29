from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class UserProfiles(Base):
    __tablename__ = 'user_profiles'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, unique=True, index=True)
    bio: Mapped[str | None] = mapped_column(String, nullable=True)
    interests: Mapped[list | None] = mapped_column(
        JSON().with_variant(JSONB(), 'postgresql'), nullable=True
    )
    photo_url: Mapped[str | None] = mapped_column(String, nullable=True)
    profile_views: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserLanguages(Base):
    __tablename__ = 'user_languages'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    language: Mapped[str] = mapped_column(String, nullable=False)
    level: Mapped[str] = mapped_column(String, nullable=False, default='A1')
    is_target: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ProfilePrivacy(Base):
    __tablename__ = 'profile_privacy'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, unique=True, index=True)
    show_stories_count: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_achievements: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_current_streak: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_best_streak: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_languages: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_language_levels: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    show_followers: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
