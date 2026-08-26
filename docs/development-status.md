# TEFERA Portfolio System — Development Status

## Milestone map

| Phase | Scope                              | Status                                        |
|-------|------------------------------------|-----------------------------------------------|
| M1    | Backend foundation, auth, roles    | ✅ Implemented & tested                       |
| M2    | Domain models, migrations, seeders | ✅ Implemented & tested                       |
| M3    | Public API, contact pipeline       | ✅ Implemented & tested                       |
| M4    | Vue 3 SPA (public + admin)         | ✅ Implemented — `vite build` passes clean    |
| M5a   | SEO endpoints + SPA meta-shell     | ✅ Implemented & tested                       |
| M5b   | Deploy configs (Nginx/Supervisor)  | ⏳ Next                                       |

## Completed this build

- Laravel 12 API configured (`bootstrap/app.php`): `api/v1` prefix, Sanctum
  stateful middleware, role/permission aliases, JSON error envelope.
- Installed & wired: `laravel/sanctum`, `spatie/laravel-permission`
  (v6.25 for PHP 8.2), `spatie/laravel-medialibrary`.
- 10 portable migrations (users, media, personal tokens, permission tables,
  profiles/skills, experiences/educations/certifications, projects,
  publications/services/testimonials, posts/tags, messages/settings/analytics).
- 20+ Eloquent models incl. `HasMedia` collections (avatar, cover, resume,
  project screenshots, post cover) and an auto-slug trait.
- Public JSON API (12 read endpoints) + contact form + analytics intake.
- Sanctum auth (`register`, `login`, `logout`, `me`) with permission-scoped
  tokens.
- Admin CRUD controllers for every resource + dashboard + settings +
  message inbox (read/unread/stats).
- `ForwardContactMessage` queued job → email (admins) + Telegram (optional).
- Seeders: roles/permissions, admin operator, realistic sample profile/content.
- **Vue 3 SPA (`frontend/`)** on Vite 6 + Tailwind CSS 4:
  - Axios client (`src/api/http.js`) talks to `/api/v1`, injects the Bearer
    token, unwraps the `{success,message,data,meta}` envelope and preserves
    HTTP status + 422 field errors for forms.
  - Pinia auth store + router guard (`requiresAuth`) with session restore via
    `GET /auth/me`; automatic token cleanup on logout/401.
  - Public pages: Home (hero/featured/services/posts/testimonials), Projects
    list with category filter + pagination, Project detail (tech stack,
    skills, screenshots), Blog list with tag filter, Post detail, Services
    grid, Contact form (client validation → `POST /contact`).
  - Admin panel at `/admin`: dark sidebar layout, login screen, dashboard
    (counts + recent messages), full project CRUD modal (multipart media
    upload support, skill sync) and a message inbox (unread filter, auto
    mark-as-read, delete, stats).
  - Generic admin CRUD engine (`CrudTable.vue` + declarative registry in
    `src/api/resources.js`) covering skills, experiences, educations,
    certifications, publications, services and testimonials.
- **SEO layer (new this milestone):**
  - `SeoController` serves `/robots.txt` (Disallow `/admin`, Sitemap link)
    and `/sitemap.xml` built from real DB slugs only — active projects,
    published posts, existing SPA routes — cached for 6h; drafts never leak.
  - Root `/` redirects to the SPA when `FRONTEND_URL` is set (local dev);
    falls back to the welcome view otherwise (production single-domain).
  - `useSeo` composable: idempotent singleton `<title>`, description, robots,
    OG/Twitter cards, canonical link and a replaced-on-navigation JSON-LD
    script. Wired into every public view — Person schema on Home, Article on
    posts, CreativeWork on projects, `noindex, nofollow` on the 404 page.
  - `index.html` carries sensible crawler fallbacks pre-hydration.
- **Test suite: 14 passing / 50 assertions** — unit tests plus feature suites:
  `PortfolioApiTest` (8), `SeoTest` (3: robots contract, sitemap includes
  published slugs only, deactivated projects excluded), `WebRoutesTest`
  (2: FRONTEND_URL redirect vs welcome fallback). Stale Laravel scaffold
  `ExampleTest` removed.

## Environment notes

- **PostgreSQL is not installed on this machine**, so the local + test
  database is SQLite (`DB_CONNECTION=sqlite`; PHPUnit uses `:memory:`).
  Production switches to PostgreSQL via the commented env block — all
  migrations are driver-portable.
- Admin bootstrap credentials live in `.env` (`ADMIN_EMAIL`,
  `ADMIN_PASSWORD`) and must be rotated before deployment.
- Developer shell on this machine has a flaky renderer; long-running commands
  are driven through `tools/*.bat` helpers which write to `tools/*.log`.
  Note: while `artisan-run.bat serve` is alive it holds the shared log open —
  run ad-hoc phpunit/build directly with dedicated logs instead.
- Git repository initialized (spec §36) with grouped conventional commits;
  `.env`, vendor trees, node_modules and SQLite files are git-ignored.

## Next steps

1. ✅ SEO meta-shell + robots/sitemap (this milestone).
2. ⏳ `deploy/` configs: Nginx vhost (SPA + API co-hosted), Supervisor queue
   worker + scheduler entries, backup scripts (§32–33) and DEPLOYMENT.md.
3. Production hardening pass (rate limits on public POST routes, security
   headers middleware, HTTPS/HSTS notes, media S3 disk option).
4. Remaining spec modules behind existing abstractions: teaching/research/
   Odoo case-study content types (M6+), global search endpoint, analytics
   dashboard widgets, feedback module, media library UI.
