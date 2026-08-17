"""make grammar lesson tip trilingual

Revision ID: 3f9d0a1b7c4e
Revises: 8a1c5f2e9d3b
Create Date: 2026-08-16 00:10:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '3f9d0a1b7c4e'
down_revision = '8a1c5f2e9d3b'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column('grammar_lessons', 'tip', new_column_name='tip_en')
    op.add_column('grammar_lessons', sa.Column('tip_ru', sa.String(), nullable=True))
    op.add_column('grammar_lessons', sa.Column('tip_tg', sa.String(), nullable=True))


def downgrade():
    op.drop_column('grammar_lessons', 'tip_tg')
    op.drop_column('grammar_lessons', 'tip_ru')
    op.alter_column('grammar_lessons', 'tip_en', new_column_name='tip')
