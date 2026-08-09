"""add interface_language to user_settings

Revision ID: a3c9f1e7b204
Revises: 26d814e01d11
Create Date: 2026-08-09 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3c9f1e7b204'
down_revision: Union[str, Sequence[str], None] = '26d814e01d11'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        'user_settings',
        sa.Column('interface_language', sa.String(), nullable=False, server_default='en'),
    )
    op.alter_column('user_settings', 'interface_language', server_default=None)


def downgrade() -> None:
    op.drop_column('user_settings', 'interface_language')
