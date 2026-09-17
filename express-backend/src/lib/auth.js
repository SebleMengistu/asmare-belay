'use strict'

const crypto = require('crypto')
const { UnauthorizedError, ForbiddenError } = require('./respond')
const { isoNow } = require('./format')
const { lastInsertId } = require('./db')

function sha256(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex')
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a))
  const bufB = Buffer.from(String(b))
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

function rolesFor(db, userId) {
  return db
    .prepare(
      `SELECT r.name FROM model_has_roles mhr
       JOIN roles r ON r.id = mhr.role_id
       WHERE mhr.model_type = 'User' AND mhr.model_id = ?
       ORDER BY r.id`
    )
    .all(userId)
    .map((row) => row.name)
}

function permissionsFor(db, userId) {
  return db
    .prepare(
      `SELECT DISTINCT p.name FROM role_has_permissions rhp
       JOIN permissions p ON p.id = rhp.permission_id
       JOIN model_has_roles mhr ON mhr.role_id = rhp.role_id
       WHERE mhr.model_type = 'User' AND mhr.model_id = ?
       ORDER BY p.name`
    )
    .all(userId)
    .map((row) => row.name)
}

/** Sanctum-compatible opaque token: "<id>|<plain>", stored as sha256(plain). */
function issueToken(db, userId, abilities = ['*'], name = 'token') {
  const plain = crypto.randomBytes(40).toString('base64')
  const now = isoNow()
  db.prepare(
    `INSERT INTO personal_access_tokens
       (tokenable_type, tokenable_id, name, token, abilities, created_at, updated_at)
     VALUES ('User', ?, ?, ?, ?, ?, ?)`
  ).run(userId, name, sha256(plain), JSON.stringify(abilities), now, now)
  return `${lastInsertId(db)}|${plain}`
}

function resolveToken(db, raw) {
  if (!raw || typeof raw !== 'string') return null
  const idx = raw.indexOf('|')
  if (idx <= 0) return null
  const id = Number(raw.slice(0, idx))
  const plain = raw.slice(idx + 1)
  if (!Number.isInteger(id) || !plain) return null
  const row = db.prepare('SELECT * FROM personal_access_tokens WHERE id = ?').get(id)
  if (!row || !safeEqual(sha256(plain), row.token)) return null
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.tokenable_id)
  if (!user) return null
  return { token: row, user }
}

function requireAuth(db) {
  return function authMiddleware(req, res, next) {
    const header = req.headers.authorization || ''
    const match = /^Bearer\s+(.+)$/i.exec(header.trim())
    if (!match) return next(new UnauthorizedError())
    const resolved = resolveToken(db, match[1])
    if (!resolved) return next(new UnauthorizedError())

    const { user, token } = resolved
    db.prepare('UPDATE personal_access_tokens SET last_used_at = ? WHERE id = ?').run(isoNow(), token.id)

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      roles: rolesFor(db, user.id),
      permissions: permissionsFor(db, user.id),
    }
    return next()
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || !Array.isArray(req.user.roles) || !req.user.roles.includes('admin')) {
    return next(new ForbiddenError())
  }
  return next()
}

module.exports = {
  sha256,
  rolesFor,
  permissionsFor,
  issueToken,
  resolveToken,
  requireAuth,
  requireAdmin,
}
