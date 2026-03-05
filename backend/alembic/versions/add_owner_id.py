"""Add owner_id to rooms

Revision ID: add_owner_id
Revises:
Create Date: 2026-03-06

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'add_owner_id'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add owner_id column to rooms table."""
    op.add_column('rooms', sa.Column('owner_id', sa.String(), nullable=True))
    op.create_index('ix_rooms_owner_id', 'rooms', ['owner_id'])


def downgrade() -> None:
    """Remove owner_id column from rooms table."""
    op.drop_index('ix_rooms_owner_id', table_name='rooms')
    op.drop_column('rooms', 'owner_id')
