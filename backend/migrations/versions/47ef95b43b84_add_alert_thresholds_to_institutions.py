"""Add configurable alert thresholds to institutions

Revision ID: 47ef95b43b84
Revises: cdfea26c11ea
Create Date: 2026-07-23 07:45:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '47ef95b43b84'
down_revision = 'cdfea26c11ea'
branch_labels = None
depends_on = None


# These match the values that were previously hardcoded in
# app/routes/grades.py and app/routes/attendance.py, so every existing
# institution keeps behaving exactly the same after this migration runs.
DEFAULTS = {
    'grade_alert_threshold': 50,
    'grade_alert_severe_threshold': 40,
    'absence_alert_threshold': 30,
    'absence_alert_severe_threshold': 50,
}


def upgrade():
    with op.batch_alter_table('institutions', schema=None) as batch_op:
        for column_name, default_value in DEFAULTS.items():
            batch_op.add_column(sa.Column(
                column_name, sa.Integer(), nullable=False,
                server_default=str(default_value)
            ))

    # Drop the server_default once existing + new rows are backfilled, so
    # future inserts rely on the model's Python-side default instead (kept
    # in sync with DEFAULTS above) rather than a stale DB-level default.
    with op.batch_alter_table('institutions', schema=None) as batch_op:
        for column_name in DEFAULTS:
            batch_op.alter_column(column_name, server_default=None)


def downgrade():
    with op.batch_alter_table('institutions', schema=None) as batch_op:
        for column_name in DEFAULTS:
            batch_op.drop_column(column_name)
