# BrightPath Academy

A full-stack coaching-institute web application: a public marketing site with a course catalogue, admission and contact forms, and a student portal where enrolled students can work through subjects, lessons, and downloadable notes while tracking their progress.

Built as a portfolio project with a **React (Vite)** frontend and a **Django REST Framework** backend that communicate over a JSON API using token authentication.

> **Demo content:** course descriptions, statistics, testimonials, faculty names, and contact details are sample content for demonstration. Replace them before using this project for a real institution.

## Features

**Public site**
- Home page with hero section, highlights, and sample statistics
- Course listing with filtering by stage, and course detail pages
- Admission application form and contact form, both validated on the server
- Gallery and About pages

**Accounts**
- Registration, login, and logout with token authentication
- Profile editing (name, email, phone, avatar upload with server-side image validation)
- Change password (authenticated) and forgot / reset password (emailed, single-use token link)

**Student portal** (login required)
- Dashboard with enrolled courses and overall progress
- Enroll in and leave courses
- Learning page per course: subjects, lessons, embedded YouTube videos, downloadable files
- Mark lessons complete; progress is computed by the server

**Access control**
- Lesson content and files are served only to students enrolled in that course
- Lesson progress can only be recorded by enrolled students
- Password-reset requests return the same response whether or not an account exists

**Admin**
- Django admin for courses, subjects, lessons, lesson files, enrollments, gallery, and form submissions

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite, plain CSS |
| Backend | Python, Django 5.2, Django REST Framework |
| Auth | DRF token authentication (`Authorization: Token …`) |
| Database | SQLite (development default) |
| Tooling | Oxlint (frontend lint), Django test runner (backend) |

## Architecture

```
school_website/
├── client/schoolProject/        React SPA (Vite)
│   └── src/
│       ├── api.js               All HTTP calls to the Django API, token handling
│       ├── AuthContext.jsx      Auth state (login, register, profile updates)
│       ├── App.jsx              Route table; student area nested under /dashboard
│       ├── components/          Navbar, Footer, RequireAuth, StudentLayout, etc.
│       └── pages/               Public pages and student pages (pages/student/)
└── server/schoolProject/        Django project
    ├── schoolProject/           Settings and root URL configuration
    └── schoolApp/
        ├── models.py            Course → Subject → Lesson → LessonFile, Enrollment, progress, forms
        ├── serializers.py       Validation and response shapes
        ├── views.py             API endpoints and permission checks
        ├── urls.py              /api/ routes
        └── tests.py             API tests for the main workflows
```

In development, Vite serves the frontend on port 5173 and proxies `/api` requests to Django on port 8000, so the browser sees a single origin.

## API overview

All endpoints are under `/api/`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `courses/` | Public | List courses (optional `?stage=`) |
| GET | `courses/<id>/` | Public | Course detail with subjects and lessons |
| GET | `gallery/` | Public | Gallery images (optional `?category=`) |
| POST | `contact/` | Public | Submit a contact message |
| POST | `admissions/` | Public | Submit an admission application |
| POST | `auth/register/` | Public | Create an account, returns token |
| POST | `auth/login/` | Public | Log in, returns token |
| POST | `auth/logout/` | Login | Revoke the current token |
| GET / PATCH | `auth/me/` | Login | Read or update the current user (PATCH accepts multipart for avatars) |
| POST | `auth/change-password/` | Login | Change password |
| POST | `auth/password-reset/` | Public | Email a reset link |
| POST | `auth/password-reset-confirm/` | Public | Set a new password using the emailed token |
| GET | `my-courses/` | Login | Enrolled courses with progress |
| POST / DELETE | `enroll/` | Login | Enroll in or leave a course |
| GET | `courses/<id>/learn/` | Enrolled | Full learning view with progress |
| POST / DELETE | `lessons/<id>/complete/` | Enrolled | Mark a lesson complete or incomplete |
| GET | `lesson-files/<id>/download/` | Enrolled | Download a lesson file |

## Local setup

You need Python 3.11+ and Node.js 20+.

### 1. Backend (Django API)

```bash
cd server/schoolProject
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then edit values if needed
set -a; source .env; set +a        # Windows: set the variables in your shell instead

python manage.py migrate
python manage.py createsuperuser   # optional: access to /admin/
python manage.py runserver         # http://127.0.0.1:8000
```

Django does not read `.env` automatically. Export the variables (as above) in each new terminal, or use a tool such as `direnv`.

### 2. Frontend (React app)

In a second terminal:

```bash
cd client/schoolProject
npm install
npm run dev                        # http://localhost:5173
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the Django server, so both must be running.

To add sample courses, log in to `/admin/` and create a Course, then add Subjects, Lessons, and optionally Lesson Files under it.

## Environment variables

| Variable | Where | Required | Purpose |
| --- | --- | --- | --- |
| `DJANGO_SECRET_KEY` | server | Yes, unless `DJANGO_DEBUG=True` | Django secret key. Keep it private. |
| `DJANGO_DEBUG` | server | No (default `False`) | Set `True` only for local development |
| `DJANGO_ALLOWED_HOSTS` | server | No | Comma-separated hostnames |
| `CORS_ALLOWED_ORIGINS` | server | No | Comma-separated frontend origins |
| `FRONTEND_URL` | server | No | Base URL used in password-reset emails |
| `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`, `DEFAULT_FROM_EMAIL` | server | No | Outgoing email. Default backend prints emails to the console. |
| `VITE_API_BASE_URL` | client | No | API origin when not using the Vite proxy |

See `server/schoolProject/.env.example` and `client/schoolProject/.env.example`.

## Migrations

```bash
cd server/schoolProject
python manage.py makemigrations     # after changing models
python manage.py migrate
```

## Running tests

Backend tests cover the catalogue, registration and login, password reset, enrollment gating, lesson progress, file-download access, public forms, and avatar validation.

```bash
cd server/schoolProject
python manage.py test schoolApp -v 2
```

The tests need the settings to load, so either set `DJANGO_DEBUG=True` (as in `.env.example`) or provide `DJANGO_SECRET_KEY`.

Frontend checks:

```bash
cd client/schoolProject
npm run lint
npm run build
```

## Building for production

```bash
cd client/schoolProject && npm run build      # outputs client/schoolProject/dist/
```

A production deployment needs, at minimum:
- `DJANGO_DEBUG=False`, a strong `DJANGO_SECRET_KEY`, and the real hostnames in `DJANGO_ALLOWED_HOSTS`
- HTTPS, with secure cookie settings enabled in Django
- A production WSGI server such as Gunicorn behind a reverse proxy
- Static files served through the proxy or WhiteNoise (not configured in this project)
- Uploaded media (`MEDIA_ROOT`) on persistent storage
- A production database (PostgreSQL is recommended; SQLite is configured by default)
- A real email backend for password-reset emails

This repository does not include deployment configuration, and the deployment steps above have not been tested end to end.

## Known limitations

- **No payment integration.** The checkout page shows the price and a disabled "coming soon" payment button. Enrollment is available through the enroll endpoint, which is free of charge.
- **Sample content.** Course copy, statistics, testimonials, faculty, and contact details are placeholders.
- **Not production-hardened.** Secure-cookie and HTTPS settings, static-file serving, and a production database are not configured. Login is rate-limited only by the anonymous throttle (30 requests per minute).
- **Brand mark.** The navbar and footer still use a generic inline icon. Replace it with a logo if you have one.
- **Admin-only content.** Courses, lessons, and files are managed through the Django admin. There is no instructor-facing editor.
- **No real-time features or notifications.**

## Security notes

- Secrets are read from environment variables. No secret keys, passwords, or database files are committed.
- The development fallback key is generated at startup and is only used when `DJANGO_DEBUG=True`.
- Uploaded avatars must be 2 MB or smaller and must open as a real image.
- Lesson files are served only through an authenticated, enrollment-checked endpoint.
- Reset tokens are single-use and are revoked when the password changes.
