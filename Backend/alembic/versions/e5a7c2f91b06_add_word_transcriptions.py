"""add word_transcriptions cache table and cards.transcription column

Revision ID: e5a7c2f91b06
Revises: d1f4a6c9b382
Create Date: 2026-08-10 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'e5a7c2f91b06'
down_revision: Union[str, Sequence[str], None] = 'd1f4a6c9b382'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'word_transcriptions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('word', sa.String(), nullable=False, unique=True),
        sa.Column('transcription', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index('ix_word_transcriptions_word', 'word_transcriptions', ['word'], unique=True)

    op.add_column('cards', sa.Column('transcription', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('cards', 'transcription')

    op.drop_index('ix_word_transcriptions_word', table_name='word_transcriptions')
    op.drop_table('word_transcriptions')
