# ASMARE Portfolio System — Architecture

## Overview

ASMARE is a production-ready, headless portfolio + CMS platform for a water resources
Lecturer and Researcher. It exposes a
JSON API consumed by a Vue SPA (public portfolio + admin dashboard) and ships
an SEO meta-shell for crawlers.

## Layer diagram

```
Browser (Vue 3 SPA)
   │  XHR / fetch (Bearer or Sanctum session)
   ▼
Nginx → Laravel 12 backend (JSON API / api/v1 + SEO shell on web routes)
   │
   ├─ PostgreSQL (primary; env-switchable to SQLite for local dev/tests)
   ├─ Media library (local public disk in dev, S3 in prod)
   ├─ SMTP mail (contact notifications) + Telegram Bot (optional alerts)
   └─ Queue (database driver) ← jobs: ForwardContactMessage
```

## Technology decisions

| Concern              | Choice                                        | Why                                                                |
|----------------------|-----------------------------------------------|--------------------------------------------------------------------|
| API framework        | Laravel 12 PHP 8.2                            | README-locked, productive, mature ORM/schema tooling              |
| Auth                 | Sanctum (personal access tokens + CSRF)       | First-party SPA support + simple token API for integrations       |
| Authorization        | spatie/laravel-permission                     | Roles (`admin`, `editor`) + granular permissions                  |
| Media                | spatie/laravel-medialibrary                   | Conversions, responsive images, per-model collections             |
| SPA                  | Vue 3 · Vite · Pinia · Vue Router · Tailwind  | Reactive, componentised public + admin UIs                        |
| Database             | PostgreSQL (staging/prod), SQLite (dev/test)  | Portable migrations verified against both                          |

## Repository layout

```
backend/   Laravel 12 JSON API + migrations, seeders, admin CRUD
frontend/  Vue 3 SPA (public portfolio + admin)
deploy/    Nginx/Supervisor/cron backup configs (planned)
docs/      Architecture, API, security & status docs (this folder)
tools/     Local setup helpers (composer/artisan wrappers, ext checker)
```

## Domain model

`User` 1..1 `Profile` 1..n { Skill, Experience, Education, Certification,
Project, Publication, Service, Post, Testimonial }. `Project` n..n `Skill`.
`Post` n..n tag (PostTag). `ContactMessage`, `Setting`, `AnalyticsEvent`,
Spatie roles/permissions, Media, plus framework tables.

All migrations are written with the portable Laravel schema builder (no
Postgres-only DDL) so the same schema runs on SQLite in CI/tests and on
PostgreSQL in production.

## Authentication

- `POST /auth/register`, `POST /auth/login` return an `Authorization: Bearer`
  Sanctum token scoped to the user's current permissions.
- Session-less public reads are anonymous. Admin routes require
  `auth:sanctum` **and** the `admin` role (route middleware).

## Error contract

Every API response is a uniform envelope:

```json
{ "success": true, "message": "…", "data": …, "errors": null }
```

- `422` ValidationException → delegated to the framework (rich field errors).
- `401` AuthenticationException → delegated (standard `Unauthenticated.`).
- `404` ModelNotFoundException → `{ success:false, message:"Resource not found." }`
- Other HTTP errors → status echoed in envelope.
- Unexpected `500` → `Server Error` (or debug message when `APP_DEBUG=true`).