"""add unit_test_attempts, localize story_questions into en/ru/tg with explanations

Revision ID: c48e6a1b2d70
Revises: b7d4a2f8e913
Create Date: 2026-08-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'c48e6a1b2d70'
down_revision: Union[str, Sequence[str], None] = 'b7d4a2f8e913'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'unit_test_attempts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('course_unit_id', sa.Integer(), sa.ForeignKey('course_units.id'), nullable=False),
        sa.Column('questions_snapshot', postgresql.JSONB(), nullable=True),
        sa.Column('answers', postgresql.JSONB(), nullable=True),
        sa.Column('score_percent', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='ready'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_unit_test_attempts_user_id', 'unit_test_attempts', ['user_id'])
    op.create_index('ix_unit_test_attempts_course_unit_id', 'unit_test_attempts', ['course_unit_id'])

    op.alter_column('story_questions', 'text', new_column_name='text_en')
    op.add_column('story_questions', sa.Column('text_ru', sa.String(), nullable=True))
    op.add_column('story_questions', sa.Column('text_tg', sa.String(), nullable=True))
    op.add_column('story_questions', sa.Column('explanation_en', sa.String(), nullable=True))
    op.add_column('story_questions', sa.Column('explanation_ru', sa.String(), nullable=True))
    op.add_column('story_questions', sa.Column('explanation_tg', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('story_questions', 'explanation_tg')
    op.drop_column('story_questions', 'explanation_ru')
    op.drop_column('story_questions', 'explanation_en')
    op.drop_column('story_questions', 'text_tg')
    op.drop_column('story_questions', 'text_ru')
    op.alter_column('story_questions', 'text_en', new_column_name='text')

    op.drop_index('ix_unit_test_attempts_course_unit_id', table_name='unit_test_attempts')
    op.drop_index('ix_unit_test_attempts_user_id', table_name='unit_test_attempts')
    op.drop_table('unit_test_attempts')
