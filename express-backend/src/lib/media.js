'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')
const { jsonParse, isoNow } = require('./format')
const {
  storageConfigured,
  publicObjectUrl,
  ensureBucket,
  uploadObject,
  removeObjects,
} = require('./supabaseStorage')

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
  if (!path.extname(base)) base += MIME_EXT[mimeType] || ''
  return base
}

function stripExtension(fileName) {
  const ext = path.extname(fileName)
  return ext ? fileName.slice(0, -ext.length) : fileName
}

function variantFileName(fileName, variant) {
  return `${stripExtension(fileName)}-${variant}.jpg`
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

function storageFolder(media) {
  const model = modelBasename(media.model_type).replace(/[^A-Za-z0-9_-]/g, '').toLowerCase() || 'media'
  return `media/${model}/${media.model_id}/${media.id}`
}

function storagePathFor(media, fileName = media.file_name) {
  return `${storageFolder(media)}/${safeFileName(fileName, media.mime_type)}`
}

function variantStoragePath(media, variant) {
  if (!media || !media.storage_path) return null
  const directory = media.storage_path.slice(0, media.storage_path.lastIndexOf('/'))
  return `${directory}/conversions/${variantFileName(media.file_name, variant)}`
}

function remotePathsFor(media) {
  if (!media?.storage_path) return []
  const generated = jsonParse(media.generated_conversions, {}) || {}
  return [
    media.storage_path,
    ...Object.keys(generated)
      .filter((variant) => generated[variant])
      .map((variant) => variantStoragePath(media, variant)),
  ].filter(Boolean)
}

async function insertMedia(db, media) {
  const now = isoNow()
  const result = await db.run(
    `INSERT INTO media
       (model_type, model_id, uuid, collection_name, name, file_name, mime_type, disk,
       size, custom_properties, generated_conversions, order_column, storage_path, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'public', ?, ?, ?, ?, ?, ?, ?)`,
    modelBasename(media.model_type),
    media.model_id,
    crypto.randomUUID(),
    media.collection_name,
    media.name,
    media.file_name,
    media.mime_type || null,
    media.size || 0,
    JSON.stringify({}),
    media.generated_conversions ? JSON.stringify(media.generated_conversions) : null,
    media.order_column ?? null,
    media.storage_path || null,
    now,
    now
  )
  return db.get('SELECT * FROM media WHERE id = ?', result.id)
}

async function buildConversions(buffer, modelType, collection) {
  const variants = variantsFor(modelType, collection)
  const generated = {}
  const outputs = []
  if (!sharp || !String(collection || '').length || variants.length === 0) {
    return { generated, outputs }
  }

  for (const variant of variants) {
    try {
      let pipeline = sharp(buffer, { failOn: 'none' }).rotate()
      if (variant.height) {
        pipeline = pipeline.resize(variant.width, variant.height, {
          fit: variant.crop ? 'cover' : 'inside',
        })
      } else {
        pipeline = pipeline.resize({ width: variant.width })
      }
      outputs.push({
        name: variant.name,
        buffer: await pipeline.jpeg({ quality: 82 }).toBuffer(),
      })
      generated[variant.name] = true
    } catch {
      /* conversion is best-effort */
    }
  }
  return { generated, outputs }
}

function storageUnavailableError() {
  const error = new Error('Media storage is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
  error.status = 503
  return error
}

async function writeLocalMedia(media, file, conversions) {
  ensureDirs()
  const dir = dirFor(media.id)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, media.file_name), file.buffer)
  if (conversions.outputs.length === 0) return
  const conversionsDir = path.join(dir, 'conversions')
  fs.mkdirSync(conversionsDir, { recursive: true })
  for (const conversion of conversions.outputs) {
    fs.writeFileSync(path.join(conversionsDir, variantFileName(media.file_name, conversion.name)), conversion.buffer)
  }
}

async function storeUpload(db, { model_type, model_id, collection_name, file, name }) {
  if (!file?.buffer || file.buffer.length === 0) throw new Error('Cannot store an empty upload.')
  const remote = storageConfigured()
  if (!remote && config.nodeEnv === 'production') throw storageUnavailableError()

  const file_name = safeFileName(file.originalname, file.mimetype)
  const media = await insertMedia(db, {
    model_type,
    model_id,
    collection_name,
    name: name || stripExtension(file_name),
    file_name,
    mime_type: file.mimetype || null,
    size: file.size || file.buffer.length,
  })
  const conversions = await buildConversions(file.buffer, model_type, collection_name)
  const storagePaths = []

  try {
    if (remote) {
      await ensureBucket()
      const originalPath = storagePathFor(media)
      await uploadObject(originalPath, file.buffer, file.mimetype)
      storagePaths.push(originalPath)
      for (const conversion of conversions.outputs) {
        const variantPath = variantStoragePath({ ...media, storage_path: originalPath }, conversion.name)
        await uploadObject(variantPath, conversion.buffer, 'image/jpeg')
        storagePaths.push(variantPath)
      }
      await db.run(
        'UPDATE media SET storage_path = ?, disk = ?, conversions_disk = ?, generated_conversions = ? WHERE id = ?',
        originalPath,
        'supabase',
        conversions.outputs.length ? 'supabase' : null,
        JSON.stringify(conversions.generated),
        media.id
      )
    } else {
      await writeLocalMedia(media, file, conversions)
      await db.run('UPDATE media SET generated_conversions = ? WHERE id = ?', JSON.stringify(conversions.generated), media.id)
    }
    return db.get('SELECT * FROM media WHERE id = ?', media.id)
  } catch (error) {
    if (storagePaths.length > 0) {
      try {
        await removeObjects(storagePaths)
      } catch {
        /* preserve the original upload error */
      }
    }
    removeMediaFiles(media.id)
    await db.run('DELETE FROM media WHERE id = ?', media.id)
    throw error
  }
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
  for (const row of rows) await deleteMediaRow(db, row)
}

async function deleteMediaRow(db, row) {
  if (row.storage_path) {
    if (!storageConfigured()) throw storageUnavailableError()
    await removeObjects(remotePathsFor(row))
  }
  removeMediaFiles(row.id)
  await db.run('DELETE FROM media WHERE id = ?', row.id)
}

function originFor(req) {
  if (req && typeof req.get === 'function' && req.get('host')) return `${req.protocol}://${req.get('host')}`
  return config.appUrl
}

function mediaUrl(media, req) {
  if (!media) return null
  if (media.storage_path) return publicObjectUrl(media.storage_path)
  return `${originFor(req)}/storage/media/${media.id}/${media.file_name}`
}

function mediaVariantUrl(media, req, variant) {
  if (!media) return null
  const generated = jsonParse(media.generated_conversions, {}) || {}
  if (generated[variant]) {
    if (media.storage_path) return publicObjectUrl(variantStoragePath(media, variant))
    const base = stripExtension(media.file_name)
    return `${originFor(req)}/storage/media/${media.id}/conversions/${base}-${variant}.jpg`
  }
  return mediaUrl(media, req)
}

function legacyOriginal(row) {
  const localPath = path.join(dirFor(row.id), safeFileName(row.file_name, row.mime_type))
  if (fs.existsSync(localPath)) return fs.readFileSync(localPath)
  if (Buffer.isBuffer(row.file_data)) return row.file_data
  if (row.file_data instanceof Uint8Array) return Buffer.from(row.file_data)
  return null
}

async function migrateMediaRow(db, row) {
  const buffer = legacyOriginal(row)
  if (!buffer) return false

  const fileName = safeFileName(row.file_name, row.mime_type)
  const originalPath = storagePathFor({ ...row, file_name: fileName })
  const conversions = await buildConversions(buffer, row.model_type, row.collection_name)
  const uploaded = [originalPath]
  try {
    await uploadObject(originalPath, buffer, row.mime_type)
    for (const conversion of conversions.outputs) {
      const variantPath = variantStoragePath({ ...row, file_name: fileName, storage_path: originalPath }, conversion.name)
      await uploadObject(variantPath, conversion.buffer, 'image/jpeg')
      uploaded.push(variantPath)
    }
    await db.run(
      'UPDATE media SET file_name = ?, storage_path = ?, disk = ?, conversions_disk = ?, generated_conversions = ? WHERE id = ?',
      fileName,
      originalPath,
      'supabase',
      conversions.outputs.length ? 'supabase' : null,
      JSON.stringify(conversions.generated),
      row.id
    )
    return true
  } catch (error) {
    try {
      await removeObjects(uploaded)
    } catch {
      /* preserve the original migration error */
    }
    throw error
  }
}

async function migrateMediaToStorage(db) {
  if (!storageConfigured()) return { migrated: 0, skipped: 0, droppedLegacyColumn: false }

  await ensureBucket()
  const hasLegacyColumn = await db.hasColumn('media', 'file_data')
  const columns = ['*']
  if (!hasLegacyColumn) columns[0] = 'id, model_type, model_id, collection_name, file_name, mime_type, generated_conversions, storage_path'
  const rows = await db.all(`SELECT ${columns[0]} FROM media WHERE storage_path IS NULL ORDER BY id`)
  let migrated = 0
  let skipped = 0
  for (const row of rows) {
    if (await migrateMediaRow(db, row)) migrated += 1
    else skipped += 1
  }

  let droppedLegacyColumn = false
  if (hasLegacyColumn) {
    const remaining = await db.get('SELECT COUNT(*)::int AS c FROM media WHERE storage_path IS NULL')
    if (Number(remaining.c) === 0) {
      await db.exec('ALTER TABLE media DROP COLUMN IF EXISTS file_data')
      droppedLegacyColumn = true
    } else {
      console.warn(`[boot] ${remaining.c} media row(s) still need migration; legacy BYTEA column retained`)
    }
  }
  if (migrated || skipped) console.log(`[boot] media storage migration: ${migrated} migrated, ${skipped} skipped`)
  return { migrated, skipped, droppedLegacyColumn }
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
  migrateMediaToStorage,
  modelBasename,
  removeMediaFiles,
}
