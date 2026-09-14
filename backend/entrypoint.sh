#!/bin/sh
set -e

echo "== TEFERA boot: migrate + seed + storage link =="

# 1) The one file Laravel MUST have before touching anything.
#    On Render free the disk is rebuilt each cold start, so this is recreated
#    every boot — that is exactly why migrations run on every boot too.
touch database/database.sqlite

# 2) APP_KEY: artisan refuses to run without one. Render env APP_KEY is blank
#    on first boot (it cannot know it before the image exists), so mint one
#    now — idempotent across restarts thanks to the mount... unless this is a
#    fresh disk, in which case we re-mint. Sessions are DB-backed anyway.
if ! php artisan config:clear --no-interaction >/dev/null 2>&1; then :; fi
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
  echo "   -> generating APP_KEY"
  APP_KEY=$(php artisan key:generate --show --no-interaction)
fi

# 3) Migrations + seeds — the deployed "live content". Fresh disk => fresh
#    seeded portfolio, which is the honest way to make a cold-started free
#    Render service show real data instead of "Couldn't load live content".
php artisan migrate --force --no-interaction
php artisan db:seed --force --no-interaction || true

# 4) Storage symlink (media URLs) — rebuilt every boot on ephemeral disk.
php artisan storage:link --no-interaction || true

# 5) Config cache. After a fresh key. Skip if bootstrapped empty.
php artisan config:cache --no-interaction 2>/dev/null || true

echo "== ready. Starting Apache =="
exec apache2-foreground
