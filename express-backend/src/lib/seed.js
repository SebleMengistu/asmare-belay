'use strict'

const bcrypt = require('bcryptjs')
const config = require('../config')
const { db } = require('./db')
const { isoNow } = require('./format')

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

/**
 * Create roles/permissions + admin account when the database has no users.
 * Idempotent (ON CONFLICT). Mirrors the original SQLite `seed()`.
 */
async function seedIfEmpty() {
  const userCount = await db.count('users')
  if (userCount > 0) return { seeded: false }

  const now = isoNow()

  const permissionIds = {}
  for (const name of PERMISSIONS) {
    const { id } = await db.run(
      `INSERT INTO permissions (name, guard_name, created_at, updated_at)
       VALUES (?, 'web', ?, ?) ON CONFLICT (name, guard_name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
      name,
      now,
      now
    )
    permissionIds[name] = id
  }

  const adminRole = await db.run(
    `INSERT INTO roles (name, guard_name, created_at, updated_at)
     VALUES ('admin', 'web', ?, ?) ON CONFLICT (name, guard_name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    now,
    now
  )
  const editorRole = await db.run(
    `INSERT INTO roles (name, guard_name, created_at, updated_at)
     VALUES ('editor', 'web', ?, ?) ON CONFLICT (name, guard_name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
    now,
    now
  )
  const adminRoleId = adminRole.id
  const editorRoleId = editorRole.id

  for (const name of PERMISSIONS) {
    await db.run(
      `INSERT INTO role_has_permissions (permission_id, role_id) VALUES (?, ?)
       ON CONFLICT DO NOTHING`,
      permissionIds[name],
      adminRoleId
    )
  }
  for (const name of EDITOR_PERMISSIONS) {
    await db.run(
      `INSERT INTO role_has_permissions (permission_id, role_id) VALUES (?, ?)
       ON CONFLICT DO NOTHING`,
      permissionIds[name],
      editorRoleId
    )
  }

  const passwordHash = bcrypt.hashSync(config.adminPassword, 12)
  const user = await db.run(
    `INSERT INTO users (name, email, password, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?) ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email RETURNING id`,
    config.adminName,
    config.adminEmail,
    passwordHash,
    now,
    now
  )
  const userId = user.id

  await db.run(
    `INSERT INTO model_has_roles (role_id, model_type, model_id) VALUES (?, 'User', ?)
     ON CONFLICT DO NOTHING`,
    adminRoleId,
    userId
  )

  await db.run(
    `INSERT INTO profiles
       (user_id, first_name, last_name, display_name, headline, tagline, roles, available_for_work, meta, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, ?)
     ON CONFLICT DO NOTHING`,
    userId,
    'Asmare',
    'Belay',
    'Asmare Belay Ngussie',
    'Hydrology & Water Resources Engineer | Lecturer & Researcher',
    'Advancing sustainable water resources solutions and climate resilience through hydrological modeling, integrated water management, and geospatial analysis.',
    JSON.stringify(['Hydrology & Water Resources Engineer', 'Lecturer & Researcher', 'Hydrological Modeler', 'GIS & Remote Sensing Specialist']),
    JSON.stringify({ experience_years: 6, students_trained: 150 }),
    now,
    now
  )

  await db.run(
    `INSERT INTO media_libraries (id, created_at, updated_at) VALUES (1, ?, ?)
     ON CONFLICT (id) DO NOTHING`,
    now,
    now
  )

  return { seeded: true }
}

module.exports = { seedIfEmpty, PERMISSIONS }