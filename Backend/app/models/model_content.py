from datetime import date, datetime

from sqlalchemy import JSON, Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
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
    source_key: Mapped[str | None] = mapped_column(String, nullable=True, unique=True, index=True)
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
    explanation_long_en: Mapped[str | None] = mapped_column(String, nullable=True)
    explanation_long_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    explanation_long_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    source_key: Mapped[str | None] = mapped_column(String, nullable=True, unique=True, index=True)
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


class GrammarAttempts(Base):
    __tablename__ = 'grammar_attempts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey('grammar_questions.id'), nullable=False, index=True)
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class Stories(Base):
    __tablename__ = 'stories'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title_en: Mapped[str] = mapped_column(String, nullable=False)
    title_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    title_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    body_en: Mapped[str] = mapped_column(String, nullable=False)
    body_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    body_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    cefr_level: Mapped[str] = mapped_column(String, nullable=False, index=True)
    genre: Mapped[str | None] = mapped_column(String, nullable=True)
    grammar_topic: Mapped[str | None] = mapped_column(String, nullable=True)
    image_url: Mapped[str | None] = mapped_column(String, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    word_dictionary: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    source_key: Mapped[str | None] = mapped_column(String, nullable=True, unique=True, index=True)
    audio_url: Mapped[str | None] = mapped_column(String, nullable=True)
    accent: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class StoryWords(Base):
    __tablename__ = 'story_words'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    story_id: Mapped[int] = mapped_column(ForeignKey('stories.id'), nullable=False, index=True)
    word: Mapped[str] = mapped_column(String, nullable=False)
    translation_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    translation_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    part_of_speech: Mapped[str | None] = mapped_column(String, nullable=True)
    context: Mapped[str | None] = mapped_column(String, nullable=True)


class StoryQuestions(Base):
    __tablename__ = 'story_questions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    story_id: Mapped[int] = mapped_column(ForeignKey('stories.id'), nullable=False, index=True)
    text_en: Mapped[str] = mapped_column(String, nullable=False)
    text_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    text_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    options: Mapped[list | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    answer: Mapped[str] = mapped_column(String, nullable=False)
    explanation_en: Mapped[str | None] = mapped_column(String, nullable=True)
    explanation_ru: Mapped[str | None] = mapped_column(String, nullable=True)
    explanation_tg: Mapped[str | None] = mapped_column(String, nullable=True)


class WordTranscriptions(Base):
    __tablename__ = 'word_transcriptions'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    word: Mapped[str] = mapped_column(String, nullable=False, unique=True, index=True)
    transcription: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class ReadingProgress(Base):
    __tablename__ = 'reading_progress'
    __table_args__ = (UniqueConstraint('user_id', 'story_id', name='uq_reading_progress_user_story'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    story_id: Mapped[int] = mapped_column(ForeignKey('stories.id'), nullable=False, index=True)
    is_completed: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class WordAudio(Base):
    __tablename__ = 'word_audio'
    __table_args__ = (UniqueConstraint('word', 'accent', name='uq_word_audio_word_accent'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    word: Mapped[str] = mapped_column(String, nullable=False, index=True)
    accent: Mapped[str] = mapped_column(String, nullable=False)
    audio_url: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class StoryListens(Base):
    __tablename__ = 'story_listens'
    __table_args__ = (
        UniqueConstraint('user_id', 'story_id', 'listened_on', name='uq_story_listens_user_story_day'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    story_id: Mapped[int] = mapped_column(ForeignKey('stories.id'), nullable=False, index=True)
    listened_on: Mapped[date] = mapped_column(Date, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
