# TEFERA Portfolio API (Express)

Node.js/Express rewrite of the original Laravel API. It keeps the **exact same
HTTP contract** as the Laravel backend (`/api/v1`, same response envelopes,
validation errors, auth tokens, media URLs), so the existing Vue frontend works
unchanged.

- Runtime: Node `>=22.12.0`.
- Database: Postgres via `pg`. Designed for **Supabase** (any Postgres works),
  so admin edits made anywhere persist everywhere — unlike the old committed
  SQLite file.
- Auth: Sanctum-compatible opaque bearer tokens stored in
  `personal_access_tokens` (`<id>|<plain>`, stored as `sha256(plain)`).
- Media: stored in a public Supabase Storage bucket, with the object path saved
  in Postgres and `sharp`-generated conversions uploaded beside the original.
  Existing local/BYTEA media is migrated on boot when its source is available.

## Getting started

```bash
cd express-backend
npm install
copy .env.example .env   # set database + Supabase Storage credentials
npm run migrate          # one-time import of data/portfolio.sqlite (SQLite) -> Postgres
npm run dev              # node --watch src/server.js
```

On boot the server runs the schema (idempotent `CREATE TABLE IF NOT EXISTS`)
and seeds an admin account only when the database has no users.

If `DATABASE_URL` is not set, the app falls back to `PGHOST`/`PGPORT`/`PGUSER`/
`PGPASSWORD`/`PGDATABASE`.

## Scripts

| Script            | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm start`       | Run the server.                               |
| `npm run dev`     | Run with `node --watch` (auto-restart).       |
| `npm run migrate` | Import SQLite -> Postgres (idempotent, safe to re-run). |

`npm run migrate` reads `express-backend/data/portfolio.sqlite` (the old
committed SQLite snapshot) and copies every table into the Postgres database
pointed at by `DATABASE_URL`, re-syncing primary-key sequences afterwards.

## Environment

See `.env.example`. Relative paths are resolved from `express-backend/`.

| Variable                | Default                              | Purpose                                   |
| ----------------------- | ------------------------------------ | ----------------------------------------- |
| `PORT`                  | `8000`                               | HTTP port.                                |
| `APP_URL`               | `http://localhost:8000`              | Public origin used for media URLs.        |
| `FRONTEND_URL`          | `http://localhost:5175`              | Allowed CORS origin.                      |
| `DATABASE_URL`          | `postgresql://...`                   | Postgres / Supabase connection string.    |
| `DB_SSL`                | auto (prod)                          | Force SSL on/off.                         |
| `SUPABASE_URL`          | unset                               | Supabase project URL for Storage.         |
| `SUPABASE_SERVICE_ROLE_KEY` | unset                           | Backend-only Storage management key.      |
| `SUPABASE_STORAGE_BUCKET` | `portfolio-media`                  | Public bucket for uploaded media.         |
| `DB_PATH`               | `./data/portfolio.sqlite`            | SQLite source for `npm run migrate`.      |
| `LEGACY_DB_PATH`        | `../backend/database/database.sqlite`| Unused legacy import source.              |
| `LEGACY_STORAGE_PATH`   | `../backend/storage/app/public`      | Unused legacy media source.               |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | seeded only when DB is empty | First admin account.               |
| `ANALYTICS_ENABLED`     | `true`                               | Toggle `/analytics` intake.               |

## API

All routes are prefixed with `/api/v1`.

### Public

| Method | Path                 | Notes                                     |
| ------ | -------------------- | ----------------------------------------- |
| GET    | `/`                  | Home aggregate (profile, featured, posts).|
| GET    | `/profile`, `/profile/:id` | Profile resource.                   |
| GET    | `/skills`            | Skills + experiences + educations + certs.|
| GET    | `/projects`, `/projects/:slug` | Paginated (12/page), cached.    |
| GET    | `/posts`, `/posts/:slug` | Published only, paginated (10/page).  |
| GET    | `/publications`      | Publications.                             |
| GET    | `/services`          | Services.                                 |
| GET    | `/testimonials`      | Testimonials.                             |
| GET    | `/settings`          | Public settings map.                      |
| GET    | `/search?q=`         | Cross-content search (cached 120s).       |
| POST   | `/contact`           | Contact form.                             |
| POST   | `/feedback`          | Feedback form.                            |
| POST   | `/analytics`         | Analytics event intake.                   |
| POST   | `/auth/register`     | Returns `{ user, token }`.                |
| POST   | `/auth/login`        | Returns `{ user, token }`.                |
| POST   | `/auth/logout`       | Bearer token required.                    |
| GET    | `/auth/me`           | Bearer token required.                    |

### Admin (Bearer token + `admin` role)

`/admin/dashboard`, `/admin/analytics/overview`, `/admin/profile[s]`,
`/admin/messages`, `/admin/feedback`, `/admin/settings`, `/admin/media`, plus
CRUD for `skills`, `experiences`, `educations`, `certifications`,
`publications`, `services`, `testimonials`, `projects`, and `posts`.

Multipart updates use `POST` with a `_method=PUT` field (also accepts the
`X-HTTP-Method-Override` header), and PHP-style field names (`media[]`,
`tech_stack[]`, `meta[...]`).

### Response envelope

```json
{ "success": true, "message": "OK", "data": {}, "errors": null }
```

Pagination is returned in `meta.pagination`
(`current_page`, `last_page`, `per_page`, `total`). Validation failures return
`422 { "message": "The given data was invalid.", "errors": { "field": ["..."] } }`.

## Deployment (Render)

Use the blueprint in `express-backend/render.yaml` (`npm install --omit=dev`,
`node src/server.js`, health check `/up`). Set `APP_URL` to the public service
URL, `FRONTEND_URL` to the deployed SPA origin, `DATABASE_URL` to your Supabase
connection string, `SUPABASE_URL` to the project URL, and
`SUPABASE_SERVICE_ROLE_KEY` to the backend-only service role key (Render ->
Environment, **never commit secrets**). The server creates the public
`SUPABASE_STORAGE_BUCKET` bucket if it does not exist.

For an existing Supabase project, run the one-time import once so the ported
data lives in Postgres:

```bash
DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-0-<region>.pooler.supabase.com:5432/postgres" npm run migrate
```

On boot, media rows without a `storage_path` are migrated from the committed
`storage/media` files or legacy `file_data` values when available. New uploads
and generated conversions go directly to Supabase Storage, so Render restarts
do not remove them.
