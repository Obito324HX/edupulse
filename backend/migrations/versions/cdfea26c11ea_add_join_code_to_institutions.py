"""Add join_code to institutions

Revision ID: cdfea26c11ea
Revises: 1abd79c3a2ef
Create Date: 2026-07-23 00:59:45.935726

"""
from alembic import op
import sqlalchemy as sa
import secrets
import string

# revision identifiers, used by Alembic.
revision = 'cdfea26c11ea'
down_revision = '1abd79c3a2ef'
branch_labels = None
depends_on = None


def _generate_code():
    alphabet = string.ascii_uppercase + string.digits
    alphabet = alphabet.translate(str.maketrans('', '', '01OI'))
    return ''.join(secrets.choice(alphabet) for _ in range(6))


def upgrade():
    # Add as nullable first — a NOT NULL column with no server default
    # would fail immediately on any existing institution rows.
    with op.batch_alter_table('institutions', schema=None) as batch_op:
        batch_op.add_column(sa.Column('join_code', sa.String(length=6), nullable=True))

    # Backfill any existing rows with a unique code each, in Python rather
    # than SQL, so codes are actually distinct instead of all sharing one
    # generated value.
    connection = op.get_bind()
    institutions_table = sa.table('institutions', sa.column('id', sa.Integer), sa.column('join_code', sa.String))
    existing_ids = [row[0] for row in connection.execute(sa.select(institutions_table.c.id))]

    used_codes = set()
    for institution_id in existing_ids:
        code = _generate_code()
        while code in used_codes:
            code = _generate_code()
        used_codes.add(code)
        connection.execute(
            institutions_table.update()
            .where(institutions_table.c.id == institution_id)
            .values(join_code=code)
        )

    # Now that every row has a value, enforce NOT NULL + UNIQUE.
    with op.batch_alter_table('institutions', schema=None) as batch_op:
        batch_op.alter_column('join_code', existing_type=sa.String(length=6), nullable=False)
        batch_op.create_unique_constraint('uq_institutions_join_code', ['join_code'])


def downgrade():
    with op.batch_alter_table('institutions', schema=None) as batch_op:
        batch_op.drop_constraint('uq_institutions_join_code', type_='unique')
        batch_op.drop_column('join_code')
