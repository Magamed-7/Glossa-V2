"""localize course_unit theme_title into en/ru/tg

Revision ID: b7d4a2f8e913
Revises: a3c9f1e7b204
Create Date: 2026-08-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b7d4a2f8e913'
down_revision: Union[str, Sequence[str], None] = 'a3c9f1e7b204'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('course_units', sa.Column('theme_title_en', sa.String(), nullable=True))
    op.add_column('course_units', sa.Column('theme_title_tg', sa.String(), nullable=True))
    op.alter_column('course_units', 'theme_title', new_column_name='theme_title_ru')


def downgrade() -> None:
    op.alter_column('course_units', 'theme_title_ru', new_column_name='theme_title')
    op.drop_column('course_units', 'theme_title_tg')
    op.drop_column('course_units', 'theme_title_en')
