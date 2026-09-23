import axios from 'axios'

// In dev, Vite proxies /api and /storage to Laravel (see vite.config.js).
// In production (Vercel), VITE_API_BASE_URL must point to the deployed backend.
const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { Accept: 'application/json' },
})

// Simple in-memory cache for public GET requests.
// Avoids re-fetching the same data on every SPA navigation (profile, projects,
// services, etc. rarely change and are already cached server-side for 30 min).
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function shouldCache(config) {
  const url = String(config.url || '')
  const hasToken = Boolean(localStorage.getItem('asmare_token'))
  return config.method === 'get' && !hasToken && !url.includes('/admin') && url !== '/' && !url.startsWith('/projects')
}

http.interceptors.request.use((config) => {
  // Attach Bearer token for authenticated requests.
  const token = localStorage.getItem('asmare_token')
  if (token) config.headers.Authorization = `Bearer ${token}`

  // Only cache public (unauthenticated) GETs — skip admin routes.
  if (shouldCache(config)) {
    const key = config.url + (config.params ? JSON.stringify(config.params) : '')
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      // Return a resolved adapter so Axios skips the network call entirely.
      config.adapter = () => Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK (cached)',
        headers: {},
        config,
      })
    }
  }
  return config
})

// Normalise API envelope into a friendly error on failure, preserving the
// HTTP status and per-field validation errors for form handling.
http.interceptors.response.use(
  (res) => {
    // Store successful public GET responses in the cache.
    const cfg = res.config
    if (shouldCache(cfg)) {
      const key = cfg.url + (cfg.params ? JSON.stringify(cfg.params) : '')
      cache.set(key, { data: res.data, ts: Date.now() })
    }
    return res.data
  },
  (err) => {
    const payload = err.response?.data
    const error = new Error(
      payload?.message || 'Something went wrong. Please try again.',
    )
    error.status = err.response?.status
    error.errors = payload?.errors || null
    return Promise.reject(error)
  },
)

export default http
