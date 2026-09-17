'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const bcrypt = require('bcryptjs')
const { DatabaseSync } = require('node:sqlite')
const config = require('../config')
const { SCHEMA } = require('./db')
const { sqliteToIso, isoNow } = require('./format')
const { ensureDirs, modelBasename } = require('./media')

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

const ALL_TABLES = [
  'personal_access_tokens',
  'media_libraries',
  'media',
  'feedback',
  'analytics_events',
  'settings',
  'contact_messages',
  'post_tag',
  'post_tags',
  'posts',
  'testimonials',
  'services',
  'publications',
  'project_skill',
  'projects',
  'certifications',
  'educations',
  'experiences',
  'skills',
  'profiles',
  'role_has_permissions',
  'model_has_permissions',
  'model_has_roles',
  'permissions',
  'roles',
  'users',
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

const PERMISSIONS = [
  'manage profile',
  'manage projects',
  'manage posts',
  'manage skills',
  'manage experiences',
  'manage educations',
  'manage certifications',
  'manage publications',
  'manage services',
  'manage testimonials',
  'manage messages',
  'manage feedback',
  'manage settings',
]

const EDITOR_PERMISSIONS = [
  'manage profile',
  'manage projects',
  'manage posts',
  'manage skills',
  'manage testimonials',
]

function quote(identifier) {
  return `"${String(identifier).replace(/"/g, '""')}"`
}

function columnsOf(db, table) {
  return db
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((row) => row.name)
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
  // $2y$ (PHP bcrypt) hashes verify under bcryptjs once relabelled as $2a$
  // (identical algorithm + digest for ASCII passwords).
  if (column === 'password' && typeof value === 'string' && value.startsWith('$2y$')) {
    return `$2a$${value.slice(4)}`
  }
  return value
}

function isImported(db) {
  return db.prepare('SELECT COUNT(*) AS c FROM users').get().c > 0
}

function resetData(db) {
  db.exec('PRAGMA foreign_keys = OFF;')
  for (const table of ALL_TABLES) {
    db.exec(`DROP TABLE IF EXISTS ${quote(table)};`)
  }
  db.exec(SCHEMA)
  db.exec('PRAGMA foreign_keys = ON;')
}

function copyTable(source, db, table) {
  const targetColumns = columnsOf(db, table)
  const sourceColumns = columnsOf(source, table)
  const columns = targetColumns.filter((column) => sourceColumns.includes(column))
  if (columns.length === 0) return 0

  const columnList = columns.map(quote).join(', ')
  const placeholders = columns.map(() => '?').join(', ')
  const rows = source.prepare(`SELECT ${columnList} FROM ${quote(table)}`).all()
  const insert = db.prepare(`INSERT INTO ${quote(table)} (${columnList}) VALUES (${placeholders})`)

  let count = 0
  for (const row of rows) {
    insert.run(...columns.map((column) => transformValue(column, row[column])))
    count += 1
  }
  return count
}

function copyMediaFiles(db) {
  ensureDirs()
  if (!fs.existsSync(config.legacyStoragePath)) return 0

  const rows = db.prepare('SELECT id, file_name FROM media').all()
  let copied = 0

  for (const row of rows) {
    const sourceDir = path.join(config.legacyStoragePath, String(row.id))
    if (!fs.existsSync(sourceDir)) continue

    const destDir = path.join(config.mediaDir, String(row.id))
    fs.mkdirSync(destDir, { recursive: true })

    const original = path.join(sourceDir, row.file_name)
    if (fs.existsSync(original)) {
      fs.copyFileSync(original, path.join(destDir, row.file_name))
      copied += 1
    }

    const sourceConversions = path.join(sourceDir, 'conversions')
    if (fs.existsSync(sourceConversions)) {
      const ext = path.extname(row.file_name)
      const base = ext ? row.file_name.slice(0, -ext.length) : row.file_name
      const destConversions = path.join(destDir, 'conversions')
      for (const file of fs.readdirSync(sourceConversions)) {
        if (!file.startsWith(`${base}-`)) continue
        fs.mkdirSync(destConversions, { recursive: true })
        fs.copyFileSync(path.join(sourceConversions, file), path.join(destConversions, file))
        copied += 1
      }
    }
  }
  return copied
}

function ensureUuids(db) {
  const rows = db.prepare(`SELECT id FROM media WHERE uuid IS NULL OR uuid = ''`).all()
  const update = db.prepare('UPDATE media SET uuid = ? WHERE id = ?')
  for (const row of rows) update.run(crypto.randomUUID(), row.id)
}

function importLegacy(db, { force = false } = {}) {
  if (!fs.existsSync(config.legacyDbPath)) {
    throw new Error(`Legacy database not found at ${config.legacyDbPath}`)
  }

  const source = new DatabaseSync(config.legacyDbPath, { readOnly: true })
  db.exec('PRAGMA foreign_keys = OFF;')
  if (force) resetData(db)

  const counts = {}
  for (const table of COPY_TABLES) {
    counts[table] = copyTable(source, db, table)
  }

  db.exec('PRAGMA foreign_keys = ON;')
  source.close()

  ensureUuids(db)
  const files = copyMediaFiles(db)

  return { imported: true, counts, files }
}

function seed(db) {
  const now = isoNow()
  db.exec('PRAGMA foreign_keys = OFF;')

  const insertPermission = db.prepare(
    'INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES (?, ?, ?, ?)'
  )
  const permissionIds = {}
  for (const name of PERMISSIONS) {
    insertPermission.run(name, 'web', now, now)
    permissionIds[name] = Number(
      db.prepare('SELECT id FROM permissions WHERE name = ?').get(name).id
    )
  }

  const insertRole = db.prepare(
    'INSERT INTO roles (name, guard_name, created_at, updated_at) VALUES (?, ?, ?, ?)'
  )
  insertRole.run('admin', 'web', now, now)
  insertRole.run('editor', 'web', now, now)
  const adminRoleId = Number(db.prepare("SELECT id FROM roles WHERE name = 'admin'").get().id)
  const editorRoleId = Number(db.prepare("SELECT id FROM roles WHERE name = 'editor'").get().id)

  const attachPermission = db.prepare('INSERT INTO role_has_permissions (permission_id, role_id) VALUES (?, ?)')
  for (const name of PERMISSIONS) attachPermission.run(permissionIds[name], adminRoleId)
  for (const name of EDITOR_PERMISSIONS) attachPermission.run(permissionIds[name], editorRoleId)

  const passwordHash = bcrypt.hashSync(config.adminPassword, 12)
  db.prepare(
    'INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
  ).run(config.adminName, config.adminEmail, passwordHash, now, now)
  const userId = Number(db.prepare('SELECT id FROM users WHERE email = ?').get(config.adminEmail).id)

  db.prepare(
    "INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'User', ?)"
  ).run(adminRoleId, userId)

  db.prepare(
    `INSERT INTO profiles
       (user_id, first_name, last_name, display_name, headline, tagline, roles, available_for_work, meta, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`
  ).run(
    userId,
    'TEFERA',
    'Alas',
    config.adminName,
    'Software Developer & IT Lecturer',
    'I build reliable web platforms and teach the next generation of engineers.',
    JSON.stringify(['IT Lecturer', 'Software Developer', 'Odoo Consultant', 'Researcher']),
    JSON.stringify({ experience_years: 0, students_trained: 0 }),
    now,
    now
  )

  db.prepare('INSERT INTO media_libraries (id, created_at, updated_at) VALUES (1, ?, ?)').run(now, now)

  db.exec('PRAGMA foreign_keys = ON;')
  return { imported: false, seeded: true }
}

function runImportIfNeeded(db) {
  if (isImported(db)) return { imported: false }
  if (fs.existsSync(config.legacyDbPath)) {
    return importLegacy(db)
  }
  return seed(db)
}

module.exports = { runImportIfNeeded, importLegacy, seed, isImported, COPY_TABLES, PERMISSIONS }
