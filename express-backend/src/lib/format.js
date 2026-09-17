'use strict'

/** Small helpers mirroring the Laravel casts/formatting used by the API. */

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (value === null || value === undefined) return null
  const v = String(value).toLowerCase()
  if (['1', 'true', 'on', 'yes'].includes(v)) return true
  if (['0', 'false', 'off', 'no', ''].includes(v)) return false
  return null
}

function toInt(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function toFloat(value) {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

function toDateString(value) {
  if (value === null || value === undefined || value === '') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}

function toIso(value) {
  if (value === null || value === undefined || value === '') return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toISOString()
}

/** 'YYYY-MM-DD HH:MM:SS' (Laravel/SQLite, UTC) -> ISO-8601. */
function sqliteToIso(value) {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') return value
  const match = /^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2})$/.exec(value.trim())
  if (match) return new Date(`${match[1]}T${match[2]}Z`).toISOString()
  return value
}

function isoNow() {
  return new Date().toISOString()
}

function jsonParse(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback
  if (typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

/** Serialise a JS value for a TEXT/JSON column. */
function toJsonColumn(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function normalizeUrl(value) {
  const v = String(value ?? '').trim()
  if (v === '') return null
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(v) ? v : `https://${v}`
}

function slugify(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-')
}

/** Laravel HasSlug: ensure uniqueness against an existing table + row. */
function uniqueSlug(db, table, base, ignoreId = 0) {
  const root = slugify(base) || 'untitled'
  const exists = db.prepare(`SELECT COUNT(*) AS c FROM ${table} WHERE slug = ? AND id != ?`)
  const take = (candidate) => exists.get(candidate, ignoreId).c > 0
  if (!take(root)) return root
  let i = 2
  let candidate = `${root.slice(0, 248)}-${i}`
  while (take(candidate)) {
    i += 1
    candidate = `${root.slice(0, 248)}-${i}`
  }
  return candidate
}

/** Carbon diffInYears(current) on a date string. */
function diffInYears(dateValue, now = new Date()) {
  if (!dateValue) return null
  const start = new Date(dateValue)
  if (Number.isNaN(start.getTime())) return null
  let years = now.getUTCFullYear() - start.getUTCFullYear()
  const monthDiff = now.getUTCMonth() - start.getUTCMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < start.getUTCDate())) {
    years -= 1
  }
  return years < 0 ? 0 : years
}

module.exports = {
  isPlainObject,
  toBoolean,
  toInt,
  toFloat,
  toDateString,
  toIso,
  sqliteToIso,
  isoNow,
  jsonParse,
  toJsonColumn,
  normalizeUrl,
  slugify,
  uniqueSlug,
  diffInYears,
}
