"""add trilingual lingo service text

The marketplace has served translated titles and descriptions for a while, but the
columns behind them were only ever added by hand on the development database. A
freshly built database has the model expecting six columns the table does not have,
so every marketplace query fails with UndefinedColumn.

Revision ID: a4e91c3f7d25
Revises: b7c4e1a92f30
Create Date: 2026-08-19

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'a4e91c3f7d25'
down_revision: Union[str, Sequence[str], None] = 'b7c4e1a92f30'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

COLUMNS = ('title_en', 'title_ru', 'title_tg', 'description_en', 'description_ru', 'description_tg')


def upgrade() -> None:
    for column in COLUMNS:
        op.execute(f'ALTER TABLE lingo_services ADD COLUMN IF NOT EXISTS {column} VARCHAR')


def downgrade() -> None:
    for column in COLUMNS:
        op.execute(f'ALTER TABLE lingo_services DROP COLUMN IF EXISTS {column}')
