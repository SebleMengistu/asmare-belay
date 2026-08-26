/**
 * Per-route SEO head manager (spec §25): keeps <title>, meta description,
 * Open Graph / Twitter cards, the canonical URL and structured data in sync
 * with whatever view is mounted. Idempotent — repeated navigation upserts the
 * same singleton tags instead of stacking duplicates.
 */
const SITE_NAME = 'TEFERA Portfolio'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!href) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/** Storage paths from the API arrive relative (/storage/...); OG needs absolute. */
function absoluteUrl(value) {
  if (!value) return ''
  try {
    return new URL(value, window.location.origin).toString()
  } catch {
    return ''
  }
}

/**
 * @param {{
 *   title?: string,
 *   raw?: boolean,          // use `title` verbatim instead of "… · TEFERA"
 *   description?: string,
 *   image?: string,
 *   type?: string,          // Open Graph type: website | article | …
 *   robots?: string,        // default "index, follow"; pass "noindex, nofollow" for 404s
 *   jsonLd?: object|null,   // schema.org payload or null to clear
 * }} options
 */
export function useSeo(options = {}) {
  const {
    title,
    raw = false,
    description,
    image,
    type = 'website',
    robots = 'index, follow',
    jsonLd = null,
  } = options

  document.title = !title
    ? SITE_NAME
    : raw
      ? title
      : `${title} · ${SITE_NAME}`

  const url = absoluteUrl(window.location.pathname + window.location.search)
  const imageUrl = absoluteUrl(image)

  upsertMeta('name', 'description', description)
  upsertMeta('name', 'robots', robots)

  upsertMeta('property', 'og:site_name', SITE_NAME)
  upsertMeta('property', 'og:title', document.title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:type', type)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:image', imageUrl)

  upsertMeta('name', 'twitter:card', imageUrl ? 'summary_large_image' : 'summary')
  upsertMeta('name', 'twitter:title', document.title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', imageUrl)

  upsertLink('canonical', url)

  const existingLd = document.getElementById('ld-json')
  existingLd?.remove()
  if (jsonLd) {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.id = 'ld-json'
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)
  }
}
