# EduPulse

A multi-tenant school management platform for tracking students, grades, attendance, and academic risk across multiple institutions from a single deployment.

**Live app:** [edupulse-one.vercel.app](https://edupulse-one.vercel.app)

## Overview

EduPulse gives a school (or a group of schools sharing one deployment) a single place to manage enrollment, record grades and attendance, and surface which students need attention before it shows up on a report card. Each institution's data is fully isolated from every other institution on the same platform, so the same instance can serve many schools independently.

## Features

- **Multi-tenant institutions** — each school operates in its own isolated space, with a join code students and staff use to register into the correct institution
- **Role-based access** — super admin, institution admin, lecturer, student, and parent roles, each scoped to what they should be able to see and do
- **Courses & enrollment** — departments, courses, and lecturer assignment, with per-course rosters
- **Grades** — assignment/test/exam scores per student per course, with automatic average calculation
- **Attendance** — per-class attendance marking with automatic absence-rate tracking
- **Automatic alerting** — configurable per-institution thresholds flag students whose grade average or absence rate crosses into risk territory, with severity (medium/high) that escalates automatically as a student's situation worsens rather than staying stuck at its original level
- **Notifications** — in-app notifications to students when they're flagged
- **Password reset via email**
- **Dashboards** — at-a-glance institutional health, per-student risk status, and course-level summaries

## Tech Stack

**Frontend**
- React 19 + Vite
- Tailwind CSS 4
- React Router
- TanStack Query
- Zustand
- Recharts
- Axios

**Backend**
- Flask 3
- SQLAlchemy 2 + Flask-Migrate (Alembic)
- PostgreSQL (production) / SQLite (local development)
- Flask-JWT-Extended for authentication, with server-side token revocation on logout
- Flask-Limiter for rate limiting
- Resend for transactional email (HTTPS API, not SMTP — Render blocks outbound SMTP on free instances)

**Infrastructure**
- Frontend deployed on Vercel
- Backend deployed on Render
- Postgres hosted on Neon

## Security

- Passwords hashed with Werkzeug's scrypt-based hasher
- All queries go through the ORM — no raw SQL
- Institution-scoped access control enforced on every endpoint that touches student data
- Role escalation blocked at registration — a user cannot self-assign an elevated role
- Rate limiting on authentication endpoints
- CORS restricted to a configured origin allowlist
- Security headers (CSP, X-Frame-Options, HSTS, etc.) applied to every response
- JWTs are revoked server-side on logout via a token blocklist, not just discarded client-side

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- PostgreSQL (optional for local dev — SQLite is used by default)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Apply database migrations
FLASK_APP=run.py FLASK_ENV=development flask db upgrade

# Run the dev server
FLASK_APP=run.py FLASK_ENV=development flask run
```

Create a `.env` file in `backend/` (or export these as environment variables) for local development:

```
SECRET_KEY=
JWT_SECRET_KEY=
DATABASE_URL=              # optional locally, defaults to sqlite:///edupulse_dev.db
RESEND_API_KEY=
RESEND_FROM_EMAIL=              # optional, defaults to Resend's shared test sender
FRONTEND_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173
RATELIMIT_STORAGE_URI=memory://
```

In production, `SECRET_KEY`, `JWT_SECRET_KEY`, and `DATABASE_URL` are required with no fallback — the app will refuse to start without them.

To create the first super admin account:

```bash
python3 scripts/create_super_admin.py
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
edupulse/
├── backend/
│   ├── app/
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routes/       # API blueprints (auth, users, institutions, courses, grades, attendance, alerts)
│   │   └── __init__.py   # App factory, CORS, rate limiting, security headers
│   ├── migrations/       # Alembic migrations
│   ├── scripts/          # One-off admin scripts
│   └── run.py
└── frontend/
    └── src/
        ├── components/
        └── pages/
```

## Roles

| Role | Access |
|---|---|
| `super_admin` | Full access across every institution on the platform |
| `institution_admin` | Full access within their own institution |
| `lecturer` | Manage grades and attendance for their assigned courses |
| `student` | View their own grades, attendance, and alerts |
| `parent` | View linked student(s)' grades, attendance, and alerts |

## Author

Built by [Cletus Bwalya](https://obito324hx.github.io/Portfolio).
