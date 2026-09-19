'use strict'

/* eslint-disable prefer-promise-reject-errors */

const { Pool } = require('pg')
const config = require('../config')

let pool = null

/**
 * Convert SQLite-style `?` placeholders to Postgres `$1, $2, …`, while
 * ignoring `?` characters that live inside string literals.
 */
function toPgPlaceholders(sql) {
  let out = ''
  let index = 0
  let inSingle = false
  let inDouble = false
  for (let i = 0; i < sql.length; i += 1) {
    const ch = sql[i]
    if (ch === "'" && !inDouble) {
      inSingle = !inSingle
      out += ch
      continue
    }
    if (ch === '"' && !inSingle) {
      inDouble = !inDouble
      out += ch
      continue
    }
    if (ch === '?' && !inSingle && !inDouble) {
      index += 1
      out += `$${index}`
      continue
    }
    out += ch
  }
  return { sql: out, count: index }
}

/**
 * Column-name cache mirroring the old `PRAGMA table_info` introspection.
 */
const columnCache = new Map()

function open() {
  const ssl = config.dbSsl
  pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: ssl ? { rejectUnauthorized: false } : undefined,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  })
  return pool
}

function getPool() {
  if (!pool) open()
  return pool
}

function normalizeParams(params) {
  if (params === undefined || params === null) return []
  return Array.isArray(params) ? params : [params]
}

/** Convert `?` placeholders and clip params to the converted count. */
function prepare(sql, params) {
  const { sql: text, count } = toPgPlaceholders(sql)
  return { text, values: normalizeParams(params).slice(0, count) }
}

async function execute(text, values) {
  const res = await getPool().query(text, values)
  return res
}

async function all(sql, ...params) {
  const { text, values } = prepare(sql, params)
  const res = await execute(text, values)
  return res.rows
}

async function get(sql, ...params) {
  const { text, values } = prepare(sql, params)
  const res = await execute(text, values)
  return res.rows.length > 0 ? res.rows[0] : null
}

/**
 * Write query. For INSERTs we auto-append `RETURNING id` so callers can pick
 * up the generated primary key without a separate round-trip. Returns a
 * Laravel-style result: `{ id, rowCount, changes }`.
 */
async function run(sql, ...params) {
  const { text, values } = prepare(sql, params)
  const isInsert = /^\s*insert\s+into/i.test(text)
  const hasReturning = /\breturning\b/i.test(text)
  let queryText = text
  if (isInsert && !hasReturning) {
    // Only request the id back when the target table actually has one
    // (pivot tables like model_has_roles use composite keys and no `id`).
    const match = /^\s*insert\s+into\s+([^\s(]+)/i.exec(text)
    const table = match ? match[1].replace(/^"|"$/g, '') : null
    const cols = table ? await tableColumns(table) : []
    if (cols.includes('id')) queryText = `${text} RETURNING id`
  }
  const res = await execute(queryText, values)
  const row = res.rows && res.rows.length > 0 ? res.rows[0] : null
  return { id: row && row.id !== undefined ? Number(row.id) : null, rowCount: res.rowCount, changes: res.rowCount }
}

/**
 * Execute a DDL/multi-statement script (no parameters). The schema has no
 * `?` placeholders, so no conversion happens here.
 */
async function exec(sql) {
  const res = await getPool().query(sql)
  return res.command
}

async function tableColumns(table) {
  const cached = columnCache.get(table)
  if (cached) return cached
  const rows = await all(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = current_schema() AND table_name = ?`,
    table
  )
  const cols = rows.map((row) => row.column_name)
  columnCache.set(table, cols)
  return cols
}

async function hasColumn(table, column) {
  const cols = await tableColumns(table)
  return cols.includes(column)
}

async function close() {
  if (pool) {
    await pool.end()
    pool = null
  }
}

/** Seed check helper (mirrors old `SELECT COUNT(*) AS c FROM users`). */
async function count(table) {
  const row = await get(`SELECT COUNT(*)::int AS c FROM ${table}`)
  return row ? Number(row.c) : 0
}

const db = {
  all,
  get,
  run,
  exec,
  tableColumns,
  hasColumn,
  count,
  close,
}

module.exports = {
  db,
  getDb: () => db,
  open,
  close,
  toPgPlaceholders,
  tableColumns,
  hasColumn,
  count,
  SCHEMA: require('./schema').SCHEMA,
}