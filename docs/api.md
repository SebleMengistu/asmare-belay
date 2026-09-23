# ASMARE Portfolio System — API Reference

Base URL: `{APP_URL}/api/v1` — all responses use the JSON envelope
`{ success, message, data, errors }`.

## Public (read-only)

| Method | Path                 | Description                                   |
|--------|----------------------|-----------------------------------------------|
| GET    | `/`                  | Home aggregate: profile, featured projects, recent posts, testimonials, services |
| GET    | `/profile`           | Primary profile (first record)                |
| GET    | `/profile/{id}`      | Specific profile                              |
| GET    | `/skills`            | Skills, experiences, educations, certifications |
| GET    | `/projects`          | Paginated active projects (`?category=`)      |
| GET    | `/projects/{slug}`   | Single project detail                         |
| GET    | `/posts`             | Published posts (`?tag=slug`)                 |
| GET    | `/posts/{slug}`      | Single post                                   |
| GET    | `/publications`      | Research publications                         |
| GET    | `/services`          | Service catalogue                             |
| GET    | `/testimonials`      | Testimonials                                  |
| GET    | `/settings`          | Public (non-secret) settings keyed by `key`   |

## Public write

| Method | Path      | Description |
|--------|-----------|-------------|
| POST   | `/contact`| Store a contact message + queue email/Telegram notification |
| POST   | `/analytics` | Record a lightweight (GDPR-friendly) page-view/event |

`POST /contact` body:
```json
{ "name", "email", "phone?", "subject?", "message" }
```
Minimum message length 10. Returns `201`.

## Auth

| Method | Path             | Body |
|--------|------------------|------|
| POST   | `/auth/register` | name, email, password + confirmation |
| POST   | `/auth/login`    | email, password → `{ user, token }` |
| POST   | `/auth/logout`   | Bearer token (revokes all tokens)   |
| GET    | `/auth/me`       | Current user + roles + permissions  |

## Admin (Bearer + `admin` role)

`Route::apiResource` for: profiles, skills, experiences, educations,
certifications, projects, publications, services, posts, testimonials
(index / store / show / update / destroy).

| Method | Path                  |
|--------|-----------------------|
| GET    | `/admin/dashboard`    |
| GET/PUT| `/admin/settings`     |
| GET/POST/PUT| `/admin/projects` … `/admin/skills` … etc. |
| GET    | `/admin/messages` (`?unread=1`) |
| GET    | `/admin/messages/stats` |
| POST   | `/admin/messages/{id}/read` |
| DELETE | `/admin/messages/{id}` |

## Pagination meta

Indexes returning paginated collections attach `meta.pagination`:
`{ current_page, last_page, per_page, total }`.

## Errors

See `docs/architecture.md` → Error contract.