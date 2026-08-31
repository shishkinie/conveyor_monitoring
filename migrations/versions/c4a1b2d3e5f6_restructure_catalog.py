"""restructure catalog: component_type -> component, component -> conveyor_component

Revision ID: c4a1b2d3e5f6
Revises: bf75305a1a5e
Create Date: 2026-08-31 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c4a1b2d3e5f6'
down_revision: Union[str, Sequence[str], None] = 'bf75305a1a5e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_table('audit_results')
    op.drop_table('criterias')
    op.drop_table('components')
    op.drop_table('component_types')

    op.create_table(
        'components',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'conveyor_components',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('conveyor_id', sa.Integer(), nullable=False),
        sa.Column('component_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['conveyor_id'], ['conveyors.id'], ),
        sa.ForeignKeyConstraint(['component_id'], ['components.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'criterias',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('conveyor_component_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['conveyor_component_id'], ['conveyor_components.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )

    op.create_table(
        'audit_results',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('audit_id', sa.Integer(), nullable=False),
        sa.Column('criteria_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['audit_id'], ['audits.id'], ),
        sa.ForeignKeyConstraint(['criteria_id'], ['criterias.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('audit_results')
    op.drop_table('criterias')
    op.drop_table('conveyor_components')
    op.drop_table('components')

    op.create_table(
        'component_types',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'components',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('conveyor_id', sa.Integer(), nullable=False),
        sa.Column('component_type_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['component_type_id'], ['component_types.id'], ),
        sa.ForeignKeyConstraint(['conveyor_id'], ['conveyors.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'criterias',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('component_id', sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(['component_id'], ['components.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_table(
        'audit_results',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('audit_id', sa.Integer(), nullable=False),
        sa.Column('component_id', sa.Integer(), nullable=False),
        sa.Column('criteria_id', sa.Integer(), nullable=False),
        sa.Column('status', sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(['audit_id'], ['audits.id'], ),
        sa.ForeignKeyConstraint(['component_id'], ['components.id'], ),
        sa.ForeignKeyConstraint(['criteria_id'], ['criterias.id'], ),
        sa.PrimaryKeyConstraint('id'),
    )