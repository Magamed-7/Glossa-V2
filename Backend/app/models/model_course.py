from datetime import datetime

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class CourseUnit(Base):
    __tablename__ = 'course_units'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    unit_code: Mapped[str] = mapped_column(String, nullable=False)
    sequence_index: Mapped[int] = mapped_column(Integer, nullable=False, unique=True, index=True)
    cefr_level: Mapped[str] = mapped_column(String, nullable=False, index=True)
    source_unit_number: Mapped[int] = mapped_column(Integer, nullable=False)
    theme_title_en: Mapped[str | None] = mapped_column(String, nullable=True)
    theme_title_ru: Mapped[str] = mapped_column(String, nullable=False)
    theme_title_tg: Mapped[str | None] = mapped_column(String, nullable=True)
    grammar_topic_label: Mapped[str | None] = mapped_column(String, nullable=True)

    grammar_lesson_id: Mapped[int | None] = mapped_column(ForeignKey('grammar_lessons.id'), nullable=True)

    estimated_minutes: Mapped[int] = mapped_column(Integer, nullable=False, default=25)
    is_level_midpoint: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_level_final: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CourseUnitStories(Base):
    __tablename__ = 'course_unit_stories'
    __table_args__ = (UniqueConstraint('course_unit_id', 'story_id', name='uq_course_unit_story'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_unit_id: Mapped[int] = mapped_column(ForeignKey('course_units.id'), nullable=False, index=True)
    story_id: Mapped[int] = mapped_column(ForeignKey('stories.id'), nullable=False, index=True)
    match_confidence: Mapped[float | None] = mapped_column(Float, nullable=True)


class CourseUnitVocab(Base):
    __tablename__ = 'course_unit_vocab'
    __table_args__ = (UniqueConstraint('course_unit_id', 'vocab_entry_id', name='uq_course_unit_vocab'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_unit_id: Mapped[int] = mapped_column(ForeignKey('course_units.id'), nullable=False, index=True)
    vocab_entry_id: Mapped[int] = mapped_column(ForeignKey('vocab_entries.id'), nullable=False, index=True)


class UserCourseProgress(Base):
    __tablename__ = 'user_course_progress'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, unique=True, index=True)
    daily_minutes_budget: Mapped[int | None] = mapped_column(Integer, nullable=True)
    days_per_week_target: Mapped[int | None] = mapped_column(Integer, nullable=True)
    current_unit_id: Mapped[int | None] = mapped_column(ForeignKey('course_units.id'), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    last_activity_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    pace_recalc_suggested_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AtomCompletion(Base):
    __tablename__ = 'atom_completions'
    __table_args__ = (
        UniqueConstraint('user_id', 'course_unit_id', 'atom_type', name='uq_atom_completion'),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    course_unit_id: Mapped[int] = mapped_column(ForeignKey('course_units.id'), nullable=False, index=True)
    atom_type: Mapped[str] = mapped_column(String, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    time_spent_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)


class LevelTest(Base):
    __tablename__ = 'level_tests'
    __table_args__ = (UniqueConstraint('cefr_level', 'test_type', name='uq_level_test'),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cefr_level: Mapped[str] = mapped_column(String, nullable=False)
    test_type: Mapped[str] = mapped_column(String, nullable=False)


class LevelTestAttempt(Base):
    __tablename__ = 'level_test_attempts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    level_test_id: Mapped[int] = mapped_column(ForeignKey('level_tests.id'), nullable=False, index=True)
    questions_snapshot: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    answers: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    score_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default='not_generated')
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class UnitTestAttempt(Base):
    __tablename__ = 'unit_test_attempts'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey('users.id'), nullable=False, index=True)
    course_unit_id: Mapped[int] = mapped_column(ForeignKey('course_units.id'), nullable=False, index=True)
    questions_snapshot: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    answers: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), 'postgresql'), nullable=True)
    score_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String, nullable=False, default='ready')
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
