"""
Create a super_admin account directly in the database.

There is no API endpoint for this on purpose -- super_admin is the most
powerful role on the platform (it can see and act on every institution),
so it must never be reachable through self-registration or even the
admin-gated /users/staff endpoint. The only way to create one is to
already have direct database access, which is what running this script
locally against DATABASE_URL requires.

Usage (run from backend/, with your venv active):

    export DATABASE_URL="your-real-neon-connection-string"
    export FLASK_APP=run.py
    python3 scripts/create_super_admin.py

It will prompt for first name, last name, email, and password. Safe to
run more than once -- if the email already exists, it tells you instead
of creating a duplicate or silently overwriting anything.
"""
import os
import sys
import getpass

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models.user import User


def main():
    if not os.environ.get('DATABASE_URL'):
        print('DATABASE_URL is not set. Export it to point at the database')
        print('you actually want this account created in, then try again.')
        sys.exit(1)

    app = create_app('production' if os.environ.get('FLASK_ENV') == 'production' else 'development')

    with app.app_context():
        first_name = input('First name: ').strip()
        last_name = input('Last name: ').strip()
        email = input('Email: ').strip().lower()
        password = getpass.getpass('Password (min 8 characters): ')

        if not all([first_name, last_name, email, password]):
            print('All fields are required. Nothing was created.')
            sys.exit(1)

        if len(password) < 8:
            print('Password must be at least 8 characters. Nothing was created.')
            sys.exit(1)

        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"A user with email '{email}' already exists (role: {existing.role}). Nothing was created.")
            sys.exit(1)

        user = User(
            first_name=first_name,
            last_name=last_name,
            email=email,
            role='super_admin',
            institution_id=None
        )
        user.set_password(password)

        db.session.add(user)
        db.session.commit()

        print(f"\nCreated super_admin account for {email}. You can log in with it now.")


if __name__ == '__main__':
    main()
