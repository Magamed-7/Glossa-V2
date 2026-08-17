"""add price_half_yearly to plans

Revision ID: 8a1c5f2e9d3b
Revises: 570e3c87eb60
Create Date: 2026-08-16 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


revision = '8a1c5f2e9d3b'
down_revision = '570e3c87eb60'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('plans', sa.Column('price_half_yearly', sa.Numeric(10, 2), nullable=False, server_default='0'))
    op.execute("UPDATE plans SET price_half_yearly = 1440 WHERE code = 'premium'")
    op.execute("UPDATE plans SET price_half_yearly = 2850 WHERE code = 'pro'")


def downgrade():
    op.drop_column('plans', 'price_half_yearly')
