/**
 * Shared formatting/normalisation helpers shared across public views,
 * admin views and home-page components. Centralising these avoids the
 * copy/paste drift that previously duplicated the logic in several files.
 */

/** Normalise a stack/tech value (array or comma-separated string) to an array. */
export function stackOf(value) {
  return Array.isArray(value)
    ? value.filter(Boolean)
    : String(value || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
}

/**
 * Format an ISO date string/nullable to a locale string.
 * @param {string|null|undefined} iso
 * @param {{ datetime?: boolean, long?: boolean }} [opts]
 */
export function fmtDate(iso, opts = {}) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: opts.long ? 'long' : 'short',
    day: 'numeric',
    ...(opts.datetime ? { hour: '2-digit', minute: '2-digit' } : {}),
  })
}

/** Humanise a byte count (e.g. 1536 -> "1.5 KB"). */
export function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = Number(bytes)
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`
}

/** Turn a project category key into a friendly display label. */
export function categoryLabel(category) {
  if (!category) return 'Project'
  const labels = {
    web: 'Web Application',
    modeling: 'Hydrological Modeling',
    research: 'Applied Research',
    water: 'Water Resources',
    api: 'API Integration',
    ecommerce: 'E-Commerce',
  }
  return labels[String(category).toLowerCase()] || String(category).replace(/^./, (c) => c.toUpperCase())
}

/** Two-letter monogram derived from a title (used for project card fallbacks). */
export function monogram(title) {
  return String(title || 'P')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
