"""add practice_test_attempts table for self-service practice tests, isolated from roadmap progression

Revision ID: d1f4a6c9b382
Revises: c48e6a1b2d70
Create Date: 2026-08-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = 'd1f4a6c9b382'
down_revision: Union[str, Sequence[str], None] = 'c48e6a1b2d70'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'practice_test_attempts',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('cefr_levels', postgresql.JSONB(), nullable=False),
        sa.Column('story_id', sa.Integer(), sa.ForeignKey('stories.id'), nullable=True),
        sa.Column('questions_snapshot', postgresql.JSONB(), nullable=True),
        sa.Column('answers', postgresql.JSONB(), nullable=True),
        sa.Column('score_percent', sa.Float(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='ready'),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index('ix_practice_test_attempts_user_id', 'practice_test_attempts', ['user_id'])
    op.create_index('ix_practice_test_attempts_category', 'practice_test_attempts', ['category'])
    op.create_index('ix_practice_test_attempts_story_id', 'practice_test_attempts', ['story_id'])


def downgrade() -> None:
    op.drop_index('ix_practice_test_attempts_story_id', table_name='practice_test_attempts')
    op.drop_index('ix_practice_test_attempts_category', table_name='practice_test_attempts')
    op.drop_index('ix_practice_test_attempts_user_id', table_name='practice_test_attempts')
    op.drop_table('practice_test_attempts')
