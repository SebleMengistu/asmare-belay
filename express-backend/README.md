# TEFERA Portfolio API (Express)

Node.js/Express rewrite of the original Laravel API. It keeps the **exact same
HTTP contract** as the Laravel backend (`/api/v1`, same response envelopes,
validation errors, auth tokens, media URLs), so the existing Vue frontend works
unchanged.

- Runtime: Node `>=22.12.0` (uses the built-in `node:sqlite` module — no native
  build step).
- Database: SQLite at `data/portfolio.sqlite` (committed so Render boots with
  real data on its ephemeral disk).
- Auth: Sanctum-compatible opaque bearer tokens stored in
  `personal_access_tokens` (`<id>|<plain>`, stored as `sha256(plain)`).
- Media: stored under `storage/media/{id}/...` and served from `/storage/...`,
  with `sharp`-generated conversions.

## Getting started

```bash
cd express-backend
npm install
copy .env.example .env   # adjust if needed
npm run dev              # node --watch src/server.js
```

On first boot, if `data/portfolio.sqlite` is empty and the legacy Laravel
database exists (`../backend/database/database.sqlite`), it is imported
automatically (rows + media files). Otherwise a fresh admin account is seeded
from `ADMIN_EMAIL` / `ADMIN_PASSWORD`.

To force a clean re-import at any time:

```bash
npm run import
```

## Scripts

| Script           | Description                                  |
| ---------------- | -------------------------------------------- |
| `npm start`      | Run the server.                              |
| `npm run dev`    | Run with `node --watch` (auto-restart).      |
| `npm run import` | Drop + re-import the legacy Laravel SQLite.  |

## Environment

See `.env.example`. Relative paths are resolved from `express-backend/`.

| Variable                | Default                              | Purpose                                   |
| ----------------------- | ------------------------------------ | ----------------------------------------- |
| `PORT`                  | `8000`                               | HTTP port.                                |
| `APP_URL`               | `http://localhost:8000`              | Public origin used for media URLs.        |
| `FRONTEND_URL`          | `http://localhost:5175`              | Allowed CORS origin.                      |
| `DB_PATH`               | `./data/portfolio.sqlite`            | SQLite file.                              |
| `LEGACY_DB_PATH`        | `../backend/database/database.sqlite`| One-time import source.                   |
| `LEGACY_STORAGE_PATH`   | `../backend/storage/app/public`      | Legacy media files.                       |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | from Laravel `.env`         | Seeded only when nothing to import.       |
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
`node src/server.js`, health check `/up`). Commit `data/portfolio.sqlite` and
`storage/media` so the ephemeral disk has data on boot. Set `APP_URL` to the
public service URL and `FRONTEND_URL` to the deployed SPA origin.
