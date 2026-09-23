# ASMARE Portfolio System

A premium, production-ready full-stack portfolio and CMS platform for a Hydrology &
Water Resources Engineer, Lecturer, and Researcher.

## Stack

| Layer     | Technology                                                        |
|-----------|-------------------------------------------------------------------|
| Backend   | Laravel 12 · PHP 8.2+ · Sanctum · Spatie Permission/Media         |
| Frontend  | Vue 3 · Vite · Pinia · Vue Router · Tailwind CSS                  |
| Database  | PostgreSQL 16/17                                                  |
| Infra     | Queues · Scheduler · SMTP · Telegram Bot API · LinkedIn OAuth     |

## Repository Layout

```
asmare/
├── backend/    # Laravel 12 JSON API + SEO meta-shell renderer
├── frontend/   # Vue 3 SPA (public portfolio + admin dashboard)
├── deploy/     # Nginx, Supervisor, cron, backup configs
└── docs/       # Architecture, API, deployment & security documentation
```

## Status

Development in progress — see `docs/` for the architecture plan and phase-by-phase
progress reports. Documentation is generated alongside implementation milestones.

**Implemented & tested:** Backend — Laravel 12 JSON API (`api/v1`), Sanctum
auth, roles/permissions, full domain model + migrations + seeders, public
portfolio endpoints, admin CRUD API for every resource, contact pipeline
(email + Telegram), SEO endpoints (`robots.txt`, DB-driven `sitemap.xml`),
passing feature-test suite (**14 tests · 50 assertions**). Frontend — Vue 3 +
Vite SPA with public portfolio pages and a complete admin panel: projects
CRUD, message inbox, plus skills/experience/education/certifications/
publications/services/testimonials management through a generic CRUD table
engine, plus an idempotent `useSeo` composable (titles, meta description,
Open Graph / Twitter cards, canonical URLs and schema.org JSON-LD).
`vite build` passes clean. See `docs/development-status.md`.

## Getting started (backend)

```bash
cd backend
composer install
cp .env.example .env              # or use the included .env + `php artisan key:generate`
php artisan migrate:fresh --seed  # creates schema + roles + sample portfolio
php artisan test                  # run the feature suite
php artisan serve
```

Local dev/tests run on SQLite; switch to PostgreSQL in production via the
commented DB block in `.env`.

## Getting started (frontend)

```bash
cd frontend
npm install
npm run dev        # Vite dev server on :5174, proxies /api + /storage to :8000
npm run build      # production bundle
```

The SPA expects the Laravel backend running (`php artisan serve`). Sign in at
`/admin/login` with the seeded operator account (`ADMIN_EMAIL` /
`ADMIN_PASSWORD` from the backend `.env`).

> Security note: real credentials live only in uncommitted `.env` files.
> `.env.example` files document every required variable.
