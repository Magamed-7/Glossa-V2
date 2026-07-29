from datetime import datetime

from sqlalchemy import JSON, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class VocabEntries(Base):
    __tablename__ = 'vocab_entries'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    word: Mapped[str] = mapped_column(String, nullable=False, index=True)
    part_of_speech: Mapped[str | None] = mapped_column(String, nullable=True)
    example_en: Mapped[str | None] = mapped_column(String, nullable=True)
    translation_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    translation_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    cefr_level: Mapped[str] = mapped_column(String, nullable=False, index=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class GrammarLessons(Base):
    __tablename__ = 'grammar_lessons'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cefr_level: Mapped[str] = mapped_column(String, nullable=False, index=True)
    unit: Mapped[str | None] = mapped_column(String, nullable=True)
    lesson: Mapped[str] = mapped_column(String, nullable=False)
    topic: Mapped[str] = mapped_column(String, nullable=False)
    rule_en: Mapped[str | None] = mapped_column(String, nullable=True)
    rule_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    rule_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    structure: Mapped[str | None] = mapped_column(String, nullable=True)
    tip: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class GrammarExamples(Base):
    __tablename__ = 'grammar_examples'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('grammar_lessons.id'), nullable=False, index=True)
    text: Mapped[str] = mapped_column(String, nullable=False)
    order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class GrammarQuestions(Base):
    __tablename__ = 'grammar_questions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(ForeignKey('grammar_lessons.id'), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String, nullable=False)
    text_en: Mapped[str | None] = mapped_column(String, nullable=True)
    text_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    text_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    options: Mapped[list | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    answer: Mapped[str] = mapped_column(String, nullable=False)
    explanation_en: Mapped[str | None] = mapped_column(String, nullable=True)
    explanation_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    explanation_tg: Mapped[str | None] = mapped_column(String, nullable=True)
