import axios from 'axios'

// In dev, Vite proxies /api and /storage to Laravel (see vite.config.js).
const http = axios.create({
  baseURL: '/api/v1',
  headers: { Accept: 'application/json' },
})

// Attach the stored Bearer token to every request.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('tefera_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalise API envelope into a friendly error on failure, preserving the
// HTTP status and per-field validation errors for form handling.
http.interceptors.response.use(
  (res) => res.data,
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