from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Conversations(Base):
    __tablename__ = 'conversations'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    is_group: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    title: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_message_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ConversationParticipants(Base):
    __tablename__ = 'conversation_participants'
    __table_args__ = (UniqueConstraint('conversation_id', 'user_id', name='uq_conversation_participants_pair'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey('conversations.id'), nullable=False, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_read_message_id: Mapped[int | None] = mapped_column(Integer, nullable=True)


class ConversationMessages(Base):
    __tablename__ = 'conversation_messages'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey('conversations.id'), nullable=False, index=True)
    sender_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False, default='text')
    text: Mapped[str | None] = mapped_column(String, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(String, nullable=True)
    attachment_name: Mapped[str | None] = mapped_column(String, nullable=True)
    attachment_duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
