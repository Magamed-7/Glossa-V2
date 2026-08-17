"""add login xp reason

The xp_reason enum was created by ba0596ab6059 without 'login', and the value was
only ever added by hand on the development database. Any freshly built database
therefore blew up with InvalidTextRepresentationError the first time a user logged
in and daily XP was awarded, which took the whole deck endpoint down with it.

Revision ID: b7c4e1a92f30
Revises: cd31aa04dbe8
Create Date: 2026-08-18

"""
from typing import Sequence, Union

from alembic import op

revision: str = 'b7c4e1a92f30'
down_revision: Union[str, Sequence[str], None] = 'cd31aa04dbe8'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE xp_reason ADD VALUE IF NOT EXISTS 'login'")


def downgrade() -> None:
    # PostgreSQL cannot drop a value from an enum type; removing it would mean
    # rebuilding the type and rewriting every dependent row, which is not worth
    # it for an additive change.
    pass
