from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class ChatSessions(Base):
    __tablename__ = 'chat_sessions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    scenario: Mapped[str] = mapped_column(String, nullable=False)
    language: Mapped[str] = mapped_column(String, nullable=False)
    # Захвачены на момент создания сессии (из user_languages / интерфейсного языка), чтобы
    # ai_chat.send_message не делал лишний запрос к БД на каждое сообщение чата.
    level: Mapped[str | None] = mapped_column(String, nullable=True)
    native_language: Mapped[str | None] = mapped_column(String, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    seconds_spent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    context_type: Mapped[str | None] = mapped_column(String, nullable=True)
    context_ref_id: Mapped[int | None] = mapped_column(Integer, nullable=True)


class ChatMessages(Base):
    __tablename__ = 'chat_messages'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(ForeignKey('chat_sessions.id'), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String, nullable=False)
    text: Mapped[str] = mapped_column(String, nullable=False)
    corrections: Mapped[list | None] = mapped_column(
        JSON().with_variant(JSONB(), 'postgresql'), nullable=True
    )
    # Только на assistant-сообщениях — тёплая, конкретная фраза наставника про это сообщение.
    encouragement: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class UserErrors(Base):
    __tablename__ = 'user_errors'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    error_type: Mapped[str] = mapped_column(String, nullable=False)
    original: Mapped[str] = mapped_column(String, nullable=False)
    corrected: Mapped[str] = mapped_column(String, nullable=False)
    explanation: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
