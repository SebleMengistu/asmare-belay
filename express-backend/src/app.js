'use strict'

const express = require('express')
const cors = require('cors')
const multer = require('multer')
const config = require('./config')
const cache = require('./lib/cache')
const { isPlainObject } = require('./lib/format')
const { attachResponder, ApiError } = require('./lib/respond')
const { ensureDirs } = require('./lib/media')
const createPublicRouter = require('./routes/public')
const createAdminRouter = require('./routes/admin')

const BRACKET_RE = /\[[^\]]*\]/

/** Split a PHP-style bracketed key into its path segments. */
function parseKey(key) {
  const first = key.indexOf('[')
  if (first === -1) return [key]
  const segments = []
  if (first > 0) segments.push(key.slice(0, first))
  const re = /\[([^\]]*)\]/g
  let match
  while ((match = re.exec(key))) segments.push(match[1])
  return segments
}

function setPath(target, segments, value) {
  const [head, ...rest] = segments
  if (rest.length === 0) {
    if (head === '') {
      if (Array.isArray(target)) target.push(value)
    } else {
      target[head] = value
    }
    return
  }
  if (head === '') {
    if (!Array.isArray(target)) return
    const container = /^\d+$/.test(rest[0]) ? [] : {}
    target.push(container)
    setPath(container, rest, value)
    return
  }
  if (target[head] === undefined || target[head] === null || typeof target[head] !== 'object') {
    target[head] = /^\d+$/.test(rest[0]) ? [] : {}
  }
  setPath(target[head], rest, value)
}

/** Turn `tech_stack[]`, `meta[experience_years]` etc. into nested objects. */
function expandBracketKeys(body) {
  if (!isPlainObject(body)) return body
  const out = {}
  for (const [key, value] of Object.entries(body)) {
    if (!BRACKET_RE.test(key)) {
      out[key] = value
      continue
    }
    setPath(out, parseKey(key), value)
  }
  return out
}

/**
 * Mirror Laravel's TrimStrings + ConvertEmptyStringsToNull global middleware:
 * recursively trim strings and turn empty strings into null before validation.
 */
function normalizeInput(value) {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }
  if (Array.isArray(value)) return value.map(normalizeInput)
  if (isPlainObject(value)) {
    const out = {}
    for (const [key, item] of Object.entries(value)) out[key] = normalizeInput(item)
    return out
  }
  return value
}

/** Group multipart files by their base field name (`media[]` -> `media`). */
function collectUploads(files) {
  const uploads = {}
  for (const file of files || []) {
    const base = String(file.fieldname || '').replace(/\[[^\]]*\]/g, '') || 'file'
    if (!uploads[base]) uploads[base] = []
    uploads[base].push(file)
  }
  return uploads
}

const UPLOAD_LIMIT_BYTES = 10 * 1024 * 1024

function createApp(db) {
  ensureDirs()

  const app = express()
  app.set('trust proxy', true)
  app.disable('x-powered-by')

  const allowedOrigins = new Set(
    [
      config.frontendUrl,
      config.appUrl,
      'https://tefe-alas-portal.vercel.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
    ].filter(Boolean)
  )

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin) || config.nodeEnv !== 'production') {
          return callback(null, true)
        }
        return callback(null, allowedOrigins.has(origin))
      },
      credentials: true,
      exposedHeaders: ['Content-Disposition'],
    })
  )

  app.use(express.json({ limit: UPLOAD_LIMIT_BYTES }))
  app.use(express.urlencoded({ extended: true, limit: UPLOAD_LIMIT_BYTES }))

  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: UPLOAD_LIMIT_BYTES, files: 30 },
  })

  // Parse multipart bodies, then normalise the request the way Laravel does.
  app.use((req, res, next) => {
    upload.any()(req, res, (err) => {
      if (err) return next(err)
      req.uploads = collectUploads(req.files)

      // Method override: `_method` field (POST + multipart/urlencoded) or header.
      const override = String(
        (req.body && req.body._method) || req.headers['x-http-method-override'] || ''
      ).toUpperCase()
      if (override && ['PUT', 'PATCH', 'DELETE'].includes(override)) {
        req.method = override
      }

      req.body = normalizeInput(expandBracketKeys(req.body || {}))
      return next()
    })
  })

  app.use(attachResponder)

  app.use('/storage', express.static(config.storageDir, { fallthrough: true, maxAge: '7d' }))

  app.get('/up', (req, res) => res.status(200).json({ status: 'ok' }))

  const api = express.Router()
  api.use('/', createPublicRouter(db))
  api.use('/admin', createAdminRouter(db))
  app.use('/api/v1', api)

  // Route not found.
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not Found', errors: null })
  })

  // Central error handler — mirrors bootstrap/app.php exception rendering.
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)

    if (err instanceof ApiError) {
      if (err.status === 401) {
        return res.status(401).json({ message: err.message })
      }
      if (err.status === 422 && err.errors) {
        return res.status(422).json({ message: err.message, errors: err.errors })
      }
      return res.status(err.status).json({ success: false, message: err.message, errors: err.errors || null })
    }

    if (err instanceof multer.MulterError) {
      const field = String(err.field || 'file').replace(/\[[^\]]*\]/g, '')
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? `The ${field} must not be greater than ${Math.floor(UPLOAD_LIMIT_BYTES / 1024)} kilobytes.`
          : err.message
      return res.status(422).json({ message: 'The given data was invalid.', errors: { [field]: [message] } })
    }

    if (err && err.type === 'entity.parse.failed') {
      return res.status(400).json({ success: false, message: 'Invalid JSON payload.', errors: null })
    }

    const status = Number(err && err.status) >= 400 && Number(err.status) < 600 ? Number(err.status) : 500
    const message =
      status === 500 && config.nodeEnv === 'production' ? 'Server Error' : (err && err.message) || 'Server Error'
    return res.status(status).json({ success: false, message, errors: null })
  })

  return app
}

module.exports = { createApp }
