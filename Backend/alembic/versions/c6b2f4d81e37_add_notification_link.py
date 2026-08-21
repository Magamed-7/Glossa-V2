"""add notification link

A notification could say a message had arrived but not where to read it: the registry
listed the sender and a preview with no way through to the conversation. This holds the
in-app path the notification should open.

Revision ID: c6b2f4d81e37
Revises: a4e91c3f7d25
Create Date: 2026-08-19

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'c6b2f4d81e37'
down_revision: Union[str, Sequence[str], None] = 'a4e91c3f7d25'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link VARCHAR')


def downgrade() -> None:
    op.execute('ALTER TABLE notifications DROP COLUMN IF EXISTS link')
