from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Follows(Base):
    __tablename__ = 'follows'
    __table_args__ = (
        UniqueConstraint('follower_id', 'following_id', name='uq_follows_pair'),
        CheckConstraint('follower_id != following_id', name='ck_follows_no_self_follow'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    follower_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    following_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
