'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')
const { jsonParse, isoNow } = require('./format')

let sharp = null
try {
  sharp = require('sharp')
} catch {
  sharp = null
}

const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
}

/** Conversion recipe per model + collection (mirrors registerMediaConversions). */
function variantsFor(modelType, collection) {
  const model = String(modelType || '').split('\\').pop()
  if (collection === 'avatar') {
    return [
      { name: 'thumb', width: 320, height: 320, crop: true },
      { name: 'card', width: 640 },
    ]
  }
  if (collection === 'cover' && model === 'Post') {
    return [
      { name: 'card', width: 800 },
      { name: 'og', width: 1200, height: 630, crop: true },
    ]
  }
  if (collection === 'cover') {
    return [{ name: 'hero', width: 1600 }]
  }
  if (collection === 'screenshots') {
    return [
      { name: 'thumb', width: 480 },
      { name: 'card', width: 800 },
      { name: 'hero', width: 1600 },
    ]
  }
  return []
}

function ensureDirs() {
  fs.mkdirSync(config.mediaDir, { recursive: true })
  fs.mkdirSync(config.tmpDir, { recursive: true })
}

function safeFileName(originalName, mimeType) {
  let base = path.basename(String(originalName || 'file'))
  base = base.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '')
  if (!base || base === '.' || base === '..') base = 'file'
  if (!path.extname(base)) {
    base += MIME_EXT[mimeType] || ''
  }
  return base
}

function stripExtension(fileName) {
  const ext = path.extname(fileName)
  return ext ? fileName.slice(0, -ext.length) : fileName
}

function dirFor(id) {
  return path.join(config.mediaDir, String(id))
}

function removeMediaFiles(id) {
  const dir = dirFor(id)
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

function modelBasename(modelType) {
  return String(modelType || '').split('\\').pop()
}

async function insertMedia(db, media) {
  const now = isoNow()
  const result = await db.run(
    `INSERT INTO media
       (model_type, model_id, uuid, collection_name, name, file_name, mime_type, disk,
        size, custom_properties, generated_conversions, order_column, created_at, updated_at, file_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'public', ?, ?, ?, ?, ?, ?, ?)`,
    modelBasename(media.model_type),
    media.model_id,
    crypto.randomUUID(),
    media.collection_name,
    media.name,
    media.file_name,
    media.mime_type || null,
    media.size || 0,
    JSON.stringify([]),
    media.generated_conversions ? JSON.stringify(media.generated_conversions) : null,
    media.order_column ?? null,
    now,
    now
  )
  return db.get('SELECT * FROM media WHERE id = ?', result.id)
}

/**
 * Persist an uploaded file (multer memory storage) and generate conversions.
 * Returns the created media row.
 */
async function storeUpload(db, { model_type, model_id, collection_name, file, name }) {
  ensureDirs()
  const file_name = safeFileName(file.originalname, file.mimetype)
  const media = await insertMedia(db, {
    model_type,
    model_id,
    collection_name,
    name: name || stripExtension(file_name),
    file_name,
    mime_type: file.mimetype || null,
    size: file.size || (file.buffer ? file.buffer.length : 0),
  })

  const dir = dirFor(media.id)
  fs.mkdirSync(dir, { recursive: true })
  const originalPath = path.join(dir, file_name)
  fs.writeFileSync(originalPath, file.buffer)

  const variants = variantsFor(model_type, collection_name)
  const isImage = String(file.mimetype || '').startsWith('image/')
  const generated = {}

  if (isImage && sharp && variants.length > 0) {
    const conversionsDir = path.join(dir, 'conversions')
    fs.mkdirSync(conversionsDir, { recursive: true })
    const base = stripExtension(file_name)
    for (const variant of variants) {
      try {
        let pipeline = sharp(file.buffer, { failOn: 'none' }).rotate()
        if (variant.height) {
          pipeline = pipeline.resize(variant.width, variant.height, {
            fit: variant.crop ? 'cover' : 'inside',
          })
        } else {
          pipeline = pipeline.resize({ width: variant.width })
        }
        await pipeline.jpeg({ quality: 82 }).toFile(path.join(conversionsDir, `${base}-${variant.name}.jpg`))
        generated[variant.name] = true
      } catch {
        /* conversion is best-effort */
      }
    }
    if (Object.keys(generated).length > 0) {
      await db.run('UPDATE media SET generated_conversions = ? WHERE id = ?', JSON.stringify(generated), media.id)
    }
  }

  return db.get('SELECT * FROM media WHERE id = ?', media.id)
}

async function mediaRows(db, modelType, modelId, collection = null) {
  if (collection) {
    return db.all(
      `SELECT * FROM media WHERE model_type = ? AND model_id = ? AND collection_name = ?
       ORDER BY order_column IS NULL, order_column, id`,
      modelBasename(modelType),
      modelId,
      collection
    )
  }
  return db.all(
    `SELECT * FROM media WHERE model_type = ? AND model_id = ?
     ORDER BY order_column IS NULL, order_column, id`,
    modelBasename(modelType),
    modelId
  )
}

async function firstMedia(db, modelType, modelId, collection) {
  const rows = await mediaRows(db, modelType, modelId, collection)
  return rows.length > 0 ? rows[0] : null
}

async function clearMediaCollection(db, modelType, modelId, collection) {
  const rows = await mediaRows(db, modelType, modelId, collection)
  for (const row of rows) removeMediaFiles(row.id)
  await db.run('DELETE FROM media WHERE model_type = ? AND model_id = ? AND collection_name = ?',
    modelBasename(modelType),
    modelId,
    collection
  )
}

async function deleteMediaRow(db, row) {
  removeMediaFiles(row.id)
  await db.run('DELETE FROM media WHERE id = ?', row.id)
}

function originFor(req) {
  if (req && typeof req.get === 'function' && req.get('host')) {

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')
const { jsonParse, isoNow } = require('./format')

let sharp = null
try {
  sharp = require('sharp')
} catch {
  sharp = null
}

const MIME_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'application/pdf': '.pdf',
}

/** Conversion recipe per model + collection (mirrors registerMediaConversions). */
function variantsFor(modelType, collection) {
  const model = String(modelType || '').split('\\').pop()
  if (collection === 'avatar') {
    return [
      { name: 'thumb', width: 320, height: 320, crop: true },
      { name: 'card', width: 640 },
    ]
  }
  if (collection === 'cover' && model === 'Post') {
    return [
      { name: 'card', width: 800 },
      { name: 'og', width: 1200, height: 630, crop: true },
    ]
  }
  if (collection === 'cover') {
    return [{ name: 'hero', width: 1600 }]
  }
  if (collection === 'screenshots') {
    return [
      { name: 'thumb', width: 480 },
      { name: 'card', width: 800 },
      { name: 'hero', width: 1600 },
    ]
  }
  return []
}

function ensureDirs() {
  fs.mkdirSync(config.mediaDir, { recursive: true })
  fs.mkdirSync(config.tmpDir, { recursive: true })
}

function safeFileName(originalName, mimeType) {
  let base = path.basename(String(originalName || 'file'))
  base = base.replace(/\s+/g, '-').replace(/[^A-Za-z0-9._-]/g, '')
  if (!base || base === '.' || base === '..') base = 'file'
  if (!path.extname(base)) {
    base += MIME_EXT[mimeType] || ''
  }
  return base
}

function stripExtension(fileName) {
  const ext = path.extname(fileName)
  return ext ? fileName.slice(0, -ext.length) : fileName
}

function dirFor(id) {
  return path.join(config.mediaDir, String(id))
}

function removeMediaFiles(id) {
  const dir = dirFor(id)
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

function modelBasename(modelType) {
  return String(modelType || '').split('\\').pop()
}

async function insertMedia(db, media) {
  const now = isoNow()
  const result = await db.run(
    `INSERT INTO media
       (model_type, model_id, uuid, collection_name, name, file_name, mime_type, disk,
        size, custom_properties, generated_conversions, order_column, created_at, updated_at, file_data)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'public', ?, ?, ?, ?, ?, ?, ?)`,
    modelBasename(media.model_type),
    media.model_id,
    crypto.randomUUID(),
    media.collection_name,
    media.name,
    media.file_name,
    media.mime_type || null,
    media.size || 0,
    JSON.stringify([]),
    media.generated_conversions ? JSON.stringify(media.generated_conversions) : null,
    media.order_column ?? null,
    now,
    now,
    media.file_data || null
  )
  return db.get('SELECT * FROM media WHERE id = ?', result.id)
}

/**
 * Persist an uploaded file (multer memory storage) and generate conversions.
 * Returns the created media row.
 */
async function storeUpload(db, { model_type, model_id, collection_name, file, name }) {
  ensureDirs()
  const file_name = safeFileName(file.originalname, file.mimetype)
  const media = await insertMedia(db, {
    model_type,
    model_id,
    collection_name,
    name: name || stripExtension(file_name),
    file_name,
    mime_type: file.mimetype || null,
    size: file.size || (file.buffer ? file.buffer.length : 0),
    file_data: file.buffer,
  })

  const dir = dirFor(media.id)
  fs.mkdirSync(dir, { recursive: true })
  const originalPath = path.join(dir, file_name)
  fs.writeFileSync(originalPath, file.buffer)

  const variants = variantsFor(model_type, collection_name)
  const isImage = String(file.mimetype || '').startsWith('image/')
  const generated = {}

  if (isImage && sharp && variants.length > 0) {
    const conversionsDir = path.join(dir, 'conversions')
    fs.mkdirSync(conversionsDir, { recursive: true })
    const base = stripExtension(file_name)
    for (const variant of variants) {
      try {
        let pipeline = sharp(file.buffer, { failOn: 'none' }).rotate()
        if (variant.height) {
          pipeline = pipeline.resize(variant.width, variant.height, {
            fit: variant.crop ? 'cover' : 'inside',
          })
        } else {
          pipeline = pipeline.resize({ width: variant.width })
        }
        await pipeline.jpeg({ quality: 82 }).toFile(path.join(conversionsDir, `${base}-${variant.name}.jpg`))
        generated[variant.name] = true
      } catch {
        /* conversion is best-effort */
      }
    }
    if (Object.keys(generated).length > 0) {
      await db.run('UPDATE media SET generated_conversions = ? WHERE id = ?', JSON.stringify(generated), media.id)
    }
  }

  return db.get('SELECT * FROM media WHERE id = ?', media.id)
}

async function mediaRows(db, modelType, modelId, collection = null) {
  if (collection) {
    return db.all(
      `SELECT * FROM media WHERE model_type = ? AND model_id = ? AND collection_name = ?
       ORDER BY order_column IS NULL, order_column, id`,
      modelBasename(modelType),
      modelId,
      collection
    )
  }
  return db.all(
    `SELECT * FROM media WHERE model_type = ? AND model_id = ?
     ORDER BY order_column IS NULL, order_column, id`,
    modelBasename(modelType),
    modelId
  )
}

async function firstMedia(db, modelType, modelId, collection) {
  const rows = await mediaRows(db, modelType, modelId, collection)
  return rows.length > 0 ? rows[0] : null
}

async function clearMediaCollection(db, modelType, modelId, collection) {
  const rows = await mediaRows(db, modelType, modelId, collection)
  for (const row of rows) removeMediaFiles(row.id)
  await db.run('DELETE FROM media WHERE model_type = ? AND model_id = ? AND collection_name = ?',
    modelBasename(modelType),
    modelId,
    collection
  )
}

async function deleteMediaRow(db, row) {
  removeMediaFiles(row.id)
  await db.run('DELETE FROM media WHERE id = ?', row.id)
}

function originFor(req) {
  if (req && typeof req.get === 'function' && req.get('host')) {
    return `${req.protocol}://${req.get('host')}`
  }
  return config.appUrl
}

function mediaUrl(media, req) {
  if (!media) return null
  return `${originFor(req)}/storage/media/${media.id}/${media.file_name}`
}

function mediaVariantUrl(media, req, variant) {
  if (!media) return null
  const generated = jsonParse(media.generated_conversions, {}) || {}
  if (generated[variant]) {
    const base = stripExtension(media.file_name)
    return `${originFor(req)}/storage/media/${media.id}/conversions/${base}-${variant}.jpg`
  }
  return mediaUrl(media, req)
}

module.exports = {
  ensureDirs,
  variantsFor,
  storeUpload,
  mediaRows,
  firstMedia,
  clearMediaCollection,
  deleteMediaRow,
  mediaUrl,
  mediaVariantUrl,
  modelBasename,
  removeMediaFiles,
}
