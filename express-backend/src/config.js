'use strict'

const path = require('path')

const ROOT = path.resolve(__dirname, '..')

require('dotenv').config({ path: path.join(ROOT, '.env') })

const port = parseInt(process.env.PORT || '8000', 10)

function resolveEnvPath(value, fallback) {
  if (!value) return fallback
  return path.isAbsolute(value) ? value : path.resolve(ROOT, value)
}

const storageDir = path.join(ROOT, 'storage')

function trimTrailingSlashes(value) {
  return String(value || '').replace(/\/+$/, '')
}

/**
 * Postgres / Supabase connection. Prefer DATABASE_URL (e.g. Supabase's
 * "Connection string" — pooler or direct). Discrete PG* vars are supported as
 * a fallback for local development.
 */
function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL
  const parts = {
    host: process.env.PGHOST || 'localhost',
    port: process.env.PGPORT || '5432',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'postgres',
  }
  const auth = parts.password ? `${parts.user}:${encodeURIComponent(parts.password)}` : parts.user
  return `postgresql://${auth}@${parts.host}:${parts.port}/${parts.database}`
}

function dbSsl() {
  if (process.env.DB_SSL) return String(process.env.DB_SSL).toLowerCase() !== 'false'
  const url = databaseUrl()
  if (/\?.*sslmode=(require|verify-full|verify-ca)/i.test(url)) return true
  return process.env.NODE_ENV === 'production'
}

module.exports = {
  root: ROOT,
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'TEFERA Portfolio',
  appUrl: (process.env.APP_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5175').replace(/\/+$/, ''),
  databaseUrl: databaseUrl(),
  dbSsl: dbSsl(),
  supabaseUrl: trimTrailingSlashes(process.env.SUPABASE_URL),
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'portfolio-media',
  // Legacy SQLite sources — only used by the one-time migration script.
  dbPath: resolveEnvPath(process.env.DB_PATH, path.join(ROOT, 'data', 'portfolio.sqlite')),
  legacyDbPath: resolveEnvPath(
    process.env.LEGACY_DB_PATH,
    path.join(path.dirname(ROOT), 'backend', 'database', 'database.sqlite')
  ),
  legacyStoragePath: resolveEnvPath(
    process.env.LEGACY_STORAGE_PATH,
    path.join(path.dirname(ROOT), 'backend', 'storage', 'app', 'public')
  ),
  storageDir,
  mediaDir: path.join(storageDir, 'media'),
  tmpDir: path.join(storageDir, 'tmp'),
  analyticsEnabled: String(process.env.ANALYTICS_ENABLED || 'true').toLowerCase() !== 'false',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@tefera.dev',
  adminName: process.env.ADMIN_NAME || 'TEFERA Admin',
  adminPassword: process.env.ADMIN_PASSWORD || 'change-me-now',
  telegramEnabled: String(process.env.CONTACT_NOTIFY_TELEGRAM || 'false').toLowerCase() === 'true',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramChatId: process.env.TELEGRAM_CHAT_ID || '',
}
