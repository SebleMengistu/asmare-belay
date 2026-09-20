'use strict'

const cache = require('./cache')
const { isoNow, uniqueSlug } = require('./format')

const SYNC_WINDOW_MS = 5 * 60 * 1000
let lastSyncAt = 0
let activeSync = null

function usernameFromUrl(value) {
  try {
    const url = new URL(String(value || ''))
    if (url.hostname.toLowerCase() !== 'github.com') return ''
    return url.pathname.split('/').filter(Boolean)[0] || ''
  } catch {
    return ''
  }
}

function titleFromRepo(name) {
  return String(name || '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim()
}

async function fetchPublicRepositories(username) {
  const response = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/repos?type=public&sort=updated&per_page=100`,
    {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'tefera-portfolio',
      },
      signal: AbortSignal.timeout(10000),
    },
  )

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`GitHub returned ${response.status}: ${details.slice(0, 300)}`)
  }

  const repositories = await response.json()
  return Array.isArray(repositories)
    ? repositories.filter((repository) => !repository.fork && !repository.archived)
    : []
}

async function syncOnce(db, { force = false } = {}) {
  if (!force && Date.now() - lastSyncAt < SYNC_WINDOW_MS) {
    return { synced: false, skipped: true, created: 0, total: 0 }
  }

  const profile = await db.get('SELECT id, github FROM profiles ORDER BY id LIMIT 1')
  const username = usernameFromUrl(profile?.github)
  if (!username) return { synced: false, skipped: true, reason: 'github_profile_missing', created: 0, total: 0 }

  const repositories = await fetchPublicRepositories(username)
  let created = 0
  let skipped = 0

  for (const repository of repositories) {
    if (!repository.name || !repository.html_url) continue

    const existing = await db.get('SELECT id FROM projects WHERE repo_url = ?', repository.html_url)
    if (existing) {
      skipped += 1
      continue
    }

    const title = titleFromRepo(repository.name)
    const description = repository.description || `Public GitHub repository: ${title}.`
    const language = repository.language || 'GitHub'
    const now = isoNow()
    const slug = await uniqueSlug(db, 'projects', title)

    await db.run(
      `INSERT INTO projects
       (profile_id, title, slug, summary, description, category, repo_url, demo_url, tech_stack,
        featured, is_active, start_date, end_date, display_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      profile?.id || null,
      title,
      slug,
      description.slice(0, 500),
      description,
      language,
      repository.html_url,
      String(repository.homepage || '').trim() || null,
      JSON.stringify(repository.language ? [repository.language] : []),
      false,
      true,
      repository.created_at ? String(repository.created_at).slice(0, 10) : null,
      null,
      100,
      now,
      now,
    )
    created += 1
  }

  lastSyncAt = Date.now()
  if (created) cache.flush()
  return { synced: true, skipped: false, username, created, skipped_existing: skipped, total: repositories.length }
}

async function syncGithubProjects(db, options = {}) {
  if (activeSync) return activeSync
  activeSync = syncOnce(db, options)
  try {
    return await activeSync
  } finally {
    activeSync = null
  }
}

module.exports = { syncGithubProjects }
