'use strict'

const config = require('../config')

function storageConfigured() {
  return Boolean(config.supabaseUrl && config.supabaseServiceRoleKey && config.supabaseStorageBucket)
}

let bucketReady = null

function encodedPath(storagePath) {
  return String(storagePath)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')
}

function bucketPath() {
  return encodeURIComponent(config.supabaseStorageBucket)
}

function publicObjectUrl(storagePath) {
  if (!config.supabaseUrl || !config.supabaseStorageBucket || !storagePath) return null
  return `${config.supabaseUrl}/storage/v1/object/public/${bucketPath()}/${encodedPath(storagePath)}`
}

function authHeaders(extra = {}) {
  return {
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    apikey: config.supabaseServiceRoleKey,
    ...extra,
  }
}

async function storageRequest(path, options = {}) {
  if (!storageConfigured()) {
    const error = new Error('Supabase Storage is not configured.')
    error.status = 503
    throw error
  }
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: authHeaders(options.headers),
    signal: options.signal || AbortSignal.timeout(15000),
  })
  const body = await response.text()
  let payload = null
  try {
    payload = body ? JSON.parse(body) : null
  } catch {
    payload = body
  }
  if (!response.ok) {
    const error = new Error(payload?.message || payload?.error || `Supabase Storage returned ${response.status}`)
    error.status = response.status
    throw error
  }
  return payload
}

async function ensureBucket() {
  if (!storageConfigured()) return false

  if (!bucketReady) {
    bucketReady = (async () => {
      try {
        const bucket = await storageRequest(`/storage/v1/bucket/${bucketPath()}`)
        if (bucket && bucket.public === false) {
          throw new Error(`Supabase bucket "${config.supabaseStorageBucket}" must be public.`)
        }
        return true
      } catch (error) {
        if (error.status !== 404) throw error
        await storageRequest('/storage/v1/bucket', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: config.supabaseStorageBucket,
            name: config.supabaseStorageBucket,
            public: true,
          }),
        })
        return true
      }
    })().catch((error) => {
      bucketReady = null
      throw error
    })
  }
  return bucketReady
}

async function removeObjects(storagePaths) {
  const prefixes = [...new Set((Array.isArray(storagePaths) ? storagePaths : [storagePaths]).filter(Boolean))]
  if (prefixes.length === 0) return
  await storageRequest(`/storage/v1/object/${bucketPath()}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes }),
  })
}

async function removeObject(storagePath) {
  return removeObjects(storagePath)
}

module.exports = {
  storageConfigured,
  publicObjectUrl,
  ensureBucket,
  uploadObject,
  removeObject,
  removeObjects,
}

async function uploadObject(storagePath, buffer, contentType) {
  return storageRequest(`/storage/v1/object/${bucketPath()}/${encodedPath(storagePath)}`, {
    method: 'POST',
    headers: {
      'Content-Type': contentType || 'application/octet-stream',
      'x-upsert': 'true',
      'cache-control': '31536000',
    },
    body: buffer,
  })
}
