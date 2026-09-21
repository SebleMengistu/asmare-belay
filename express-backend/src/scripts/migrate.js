'use strict'

/**
 * One-time migration of the legacy SQLite database into Postgres/Supabase.
 *
 *   DATABASE_URL=postgresql://... npm run migrate
 *
 * Reads `data/portfolio.sqlite` (committed with real content), recreates the
 * Postgres schema, copies every table with the same value transformations the
 * old importer used, and rewinds the identity sequences so new inserts keep
 * working after the copied ids.
 */

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { DatabaseSync } = require('node:sqlite')
const config = require('../config')
const { db } = require('../lib/db')
const { SCHEMA } = require('../lib/schema')
const { sqliteToIso } = require('../lib/format')

const COPY_TABLES = [
  'users',
  'roles',
  'permissions',
  'model_has_roles',
  'model_has_permissions',
  'role_has_permissions',
  'profiles',
  'skills',
  'experiences',
  'educations',
  'certifications',
  'projects',
  'project_skill',
  'publications',
  'services',
  'testimonials',
  'posts',
  'post_tags',
  'post_tag',
  'contact_messages',
  'settings',
  'analytics_events',
  'feedback',
  'media',
  'media_libraries',
  'personal_access_tokens',
]

const DATETIME_COLUMNS = new Set([
  'created_at',
  'updated_at',
  'published_at',
  'read_at',
  'occurred_at',
  'last_used_at',
  'expires_at',
  'email_verified_at',
])

const MODEL_TYPE_COLUMNS = new Set(['model_type', 'tokenable_type'])

const BOOLEAN_COLUMNS = new Set([
  'is_active',
  'available_for_work',
  'featured',
  'current',
  'is_public',
])

const JSON_COLUMNS = new Set([
  'roles',
  'meta',
  'highlights',
  'skills',
  'tech_stack',
  'features',
  'manipulations',
  'custom_properties',
  'generated_conversions',
  'responsive_images',
  'abilities',
])

function quote(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

function modelBasename(modelType) {
  return String(modelType || '').split('\\').pop()
}

function toBool(value) {
  if (value === null || value === undefined) return null
  if (value === true || value === 1 || value === '1' || value === 'true') return true
  if (value === false || value === 0 || value === '0' || value === 'false') return false
  return Boolean(value)
}

function transformValue(column, value) {
  if (value === undefined) return null
  if (value === null) return null
  if (DATETIME_COLUMNS.has(column) && typeof value === 'string') {
    return sqliteToIso(value)
  }
  if (MODEL_TYPE_COLUMNS.has(column) && typeof value === 'string') {
    return modelBasename(value)
  }
  if (column === 'uuid' && typeof value === 'string' && value.trim() === '') {
    return crypto.randomUUID()
  }
  if (BOOLEAN_COLUMNS.has(column)) {
    return toBool(value)
  }
  if (JSON_COLUMNS.has(column)) {
    if (value === null || value === undefined || value === '') return null
    if (typeof value === 'object') return JSON.stringify(value)
    return value
  }
  // $2y$ (PHP bcrypt) hashes verify under bcryptjs once relabelled as $2a$
  // (identical algorithm + digest for ASCII passwords).
  if (column === 'password' && typeof value === 'string' && value.startsWith('$2y$')) {
    return `$2a$${value.slice(4)}`
  }
  return value
}

function sqliteColumns(source, table) {
  return source
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((row) => row.name)
}

async function main() {
  const sqlitePath = config.dbPath
  if (!fs.existsSync(sqlitePath)) {
    throw new Error(`Legacy SQLite database not found at ${sqlitePath}. Nothing to migrate.`)
  }

  console.log(`[migrate] applying schema to ${config.databaseUrl.replace(/:\/\/.*@/, '://***@')}`)
  await db.exec(SCHEMA)

  const source = new DatabaseSync(sqlitePath, { readOnly: true })
  const counts = {}

  for (const table of COPY_TABLES) {
    const targetColumns = await db.tableColumns(table)
    const sourceCols = sqliteColumns(source, table)
    const columns = targetColumns.filter((column) => sourceCols.includes(column))
    if (columns.length === 0) {
      counts[table] = 0
      continue
    }

    const columnList = columns.map(quote).join(', ')
    const placeholders = columns.map(() => '?').join(', ')
    const rows = source.prepare(`SELECT ${columnList} FROM ${quote(table)}`).all()
    const insertSql = `INSERT INTO ${quote(table)} (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`

    for (const row of rows) {
      await db.run(insertSql, ...columns.map((column) => transformValue(column, row[column])))
    }
    counts[table] = rows.length
  }

  source.close()

  for (const table of COPY_TABLES) {
    const columns = await db.tableColumns(table)
    if (!columns.includes('id')) continue
    await db.exec(
      `SELECT setval(pg_get_serial_sequence('${table}', 'id'), (SELECT COALESCE(MAX(id), 1) FROM ${quote(table)}))`
    )
  }

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0)
  console.log(`[migrate] imported ${total} rows across ${Object.keys(counts).length} tables.`)
  for (const [table, count] of Object.entries(counts)) {
    if (count > 0) console.log(`  ${table}: ${count}`)
  }
  console.log('[migrate] done. Media rows will be moved to Supabase Storage on API boot when configured.')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`[migrate] failed: ${error.message}`)
    process.exit(1)
  })
  .finally(() => db.close())
