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

module.exports = {
  root: ROOT,
  port,
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || 'TEFERA Portfolio',
  appUrl: (process.env.APP_URL || `http://localhost:${port}`).replace(/\/+$/, ''),
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5175').replace(/\/+$/, ''),
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
}
