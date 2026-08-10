"""add ai_chat_practice xp reason

Revision ID: fee7f86416ed
Revises: e5a7c2f91b06
Create Date: 2026-08-10 18:43:45.673931

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'fee7f86416ed'
down_revision: Union[str, Sequence[str], None] = 'e5a7c2f91b06'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE xp_reason ADD VALUE IF NOT EXISTS 'ai_chat_practice'")


def downgrade() -> None:
    # Postgres can't drop a single value from an enum type without recreating the type and
    # rewriting every row that references it — not worth it for a downgrade path. Rows using
    # 'ai_chat_practice' would simply stay as they are.
    pass
