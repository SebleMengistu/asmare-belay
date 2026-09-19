'use strict'

/**
 * In-memory equivalent of App\Support\PortfolioCache. Every public read payload
 * is cached for 30 minutes and flushed whenever the admin writes content.
 */

const TTL = 1800 // seconds
const store = new Map()

async function remember(key, callback, suffix = '', ttl = TTL) {
  const cacheKey = `portfolio.${key}${suffix !== '' ? `.${suffix}` : ''}`
  const now = Date.now()
  const hit = store.get(cacheKey)
  if (hit && hit.expires > now) return hit.value
  const value = await callback()
  store.set(cacheKey, { value, expires: now + ttl * 1000 })
  return value
}

function flush() {
  store.clear()
}

module.exports = { remember, flush, TTL }
