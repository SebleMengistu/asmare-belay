'use strict'

const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const cache = require('../lib/cache')
const config = require('../config')
const { wrap, ValidationError, NotFoundError, ApiError } = require('../lib/respond')
const { createValidator } = require('../lib/validate')
const { syncGithubProjects } = require('../lib/github')
const { toDateString, toIso, sqliteToIso, isoNow, diffInYears } = require('../lib/format')
const {
  serializeSkill,
  serializeExperience,
  serializeEducation,
  serializeCertification,
  serializePublication,
  serializeService,
  serializeTestimonial,
  serializePost,
  serializeProject,
  serializeProfile,
} = require('../lib/serialize')
const { issueToken, requireAuth, rolesFor, permissionsFor } = require('../lib/auth')

function paginationMeta(page, perPage, total) {
  return {
    current_page: page,
    last_page: Math.max(1, Math.ceil(total / perPage)),
    per_page: perPage,
    total,
  }
}

function pageParams(req, perPage) {
  const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
  return { page, perPage, offset: (page - 1) * perPage }
}

module.exports = function createPublicRouter(db) {
  const router = express.Router()
  const validate = createValidator(db)
  const auth = requireAuth(db)

  const firstProfile = () => db.get('SELECT * FROM profiles ORDER BY id LIMIT 1')

  /* ------------------------------------------------------------------ home */

  router.get(
    '/',
    wrap(async (req, res) => {
      const profile = await firstProfile()
      if (!profile) throw new NotFoundError()

      const starts = await db
        .all('SELECT start_date FROM experiences WHERE profile_id = ? AND is_active = TRUE AND start_date IS NOT NULL', profile.id)
      const earliest = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : null
      const years = earliest ? diffInYears(earliest) : null

      const meta = Object.assign({}, profile.meta ? profile.meta : {}, {
        projects_completed: await db
          .get('SELECT COUNT(*)::int AS c FROM projects WHERE profile_id = ? AND is_active = TRUE', profile.id)
          .then((row) => row.c),
        research_publications: await db
          .get('SELECT COUNT(*)::int AS c FROM publications WHERE profile_id = ? AND is_active = TRUE', profile.id)
          .then((row) => row.c),
        technologies: await db
          .get('SELECT COUNT(*)::int AS c FROM skills WHERE profile_id = ? AND is_active = TRUE', profile.id)
          .then((row) => row.c),
        experience_years: years ?? (profile.meta ? profile.meta.experience_years : 0) ?? 0,
      })
      profile.meta = meta

      const featured = await cache.remember(
        'featured_projects',
        async () => {
          const featuredRows = await db.all(
            'SELECT * FROM projects WHERE (profile_id = ? OR profile_id IS NULL) AND featured = TRUE AND is_active = TRUE ORDER BY display_order, created_at DESC',
            profile.id
          )
          const fillParams = featuredRows.length > 0 ? [profile.id, ...featuredRows.map((row) => row.id)] : [profile.id]
          const fillRows = await db.all(
            featuredRows.length > 0
              ? 'SELECT * FROM projects WHERE (profile_id = ? OR profile_id IS NULL) AND is_active = TRUE AND id NOT IN (' +
                  featuredRows.map(() => '?').join(', ') +
                  ') ORDER BY display_order, created_at DESC'
              : 'SELECT * FROM projects WHERE (profile_id = ? OR profile_id IS NULL) AND is_active = TRUE ORDER BY display_order, created_at DESC',
            ...fillParams
          )
          const rows = featuredRows.concat(fillRows)
          return Promise.all(rows.map((row) => serializeProject(db, row, req)))
        },
        'index'
      )

      const recentPosts = await cache.remember(
        'recent_posts',
        async () => {
          const rows = await db.all(
            "SELECT * FROM posts WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= ? ORDER BY published_at DESC LIMIT 3",
            isoNow()
          )
          return Promise.all(rows.map((row) => serializePost(db, row, req)))
        },
        'index'
      )

      const testimonials = await cache.remember(
        'testimonials',
        async () => {
          const rows = await db.all(
            'SELECT * FROM testimonials WHERE profile_id = ? AND is_active = TRUE ORDER BY display_order, id',
            profile.id
          )
          return rows.map(serializeTestimonial)
        },
        'index'
      )

      const services = await cache.remember(
        'services',
        async () => {
          const rows = await db.all(
            'SELECT * FROM services WHERE profile_id = ? AND is_active = TRUE ORDER BY display_order, id',
            profile.id
          )
          return rows.map(serializeService)
        },
        'index'
      )

      res.ok({
        profile: await serializeProfile(db, profile, req),
        featured_projects: featured,
        recent_posts: recentPosts,
        testimonials,
        services,
      })
    })
  )

  /* --------------------------------------------------------------- profile */

  router.get(
    '/profile',
    wrap(async (req, res) => {
      const profile = await cache.remember('profile', firstProfile)
      if (!profile) throw new NotFoundError()
      res.ok(await serializeProfile(db, profile, req))
    })
  )

  router.get(
    '/profile/:id',
    wrap(async (req, res, next) => {
      if (!/^\d+$/.test(req.params.id)) return next()
      const profile = await db.get('SELECT * FROM profiles WHERE id = ?', Number(req.params.id))
      if (!profile) throw new NotFoundError()
      res.ok(await serializeProfile(db, profile, req))
    })
  )

  /* ---------------------------------------------------------------- skills */

  router.get(
    '/skills',
    wrap(async (req, res) => {
      const payload = await cache.remember('skills', async () => {
        const profile = await firstProfile()
        if (!profile) throw new NotFoundError()
        return {
          skills: (await db.all('SELECT * FROM skills WHERE profile_id = ? AND is_active = TRUE ORDER BY id', profile.id))
            .map(serializeSkill),
          experiences: (await db.all('SELECT * FROM experiences WHERE profile_id = ? AND is_active = TRUE ORDER BY id', profile.id))
            .map(serializeExperience),
          educations: (await db.all('SELECT * FROM educations WHERE profile_id = ? AND is_active = TRUE ORDER BY id', profile.id))
            .map(serializeEducation),
          certifications: (await db.all('SELECT * FROM certifications WHERE profile_id = ? AND is_active = TRUE ORDER BY id', profile.id))
            .map(serializeCertification),
        }
      })
      res.ok(payload)
    })
  )

  /* -------------------------------------------------------------- projects */

  router.get(
    '/projects',
    wrap(async (req, res) => {
      try {
        await syncGithubProjects(db)
      } catch (error) {
        console.error('[github] project sync failed:', error.message)
      }

      const category = req.query.category || '_all'
      const payload = await cache.remember(
        'projects',
        async () => {
          const { page, perPage, offset } = pageParams(req, 12)
          const where = ['is_active = TRUE']
          const params = []
          if (category !== '_all') {
            where.push('category = ?')
            params.push(category)
          }
          const clause = where.join(' AND ')
          const total = (await db.get(`SELECT COUNT(*)::int AS c FROM projects WHERE ${clause}`, ...params)).c
          const rows = await db.all(
            `SELECT * FROM projects WHERE ${clause} ORDER BY display_order, created_at DESC LIMIT ? OFFSET ?`,
            ...params,
            perPage,
            offset
          )
          return {
            data: await Promise.all(rows.map((row) => serializeProject(db, row, req))),
            pagination: paginationMeta(page, perPage, total),
          }
        },
        category
      )
      res.ok(payload.data, 'OK', { pagination: payload.pagination })
    })
  )

  router.get(
    '/projects/:slug',
    wrap(async (req, res) => {
      const project = await cache.remember(
        'project',
        async () => {
          const row = await db.get('SELECT * FROM projects WHERE is_active = TRUE AND slug = ?', req.params.slug)
          if (!row) throw new NotFoundError()
          return await serializeProject(db, row, req)
        },
        req.params.slug
      )
      res.ok(project)
    })
  )

  /* ----------------------------------------------------------------- posts */

  const publishedWhere = "status = 'published' AND published_at IS NOT NULL AND published_at <= ?"

  router.get(
    '/posts',
    wrap(async (req, res) => {
      const tag = req.query.tag || '_all'
      const payload = await cache.remember(
        'posts',
        async () => {
          const { page, perPage, offset } = pageParams(req, 10)
          const where = [publishedWhere]
          const params = [isoNow()]
          if (tag !== '_all') {
            where.push(
              'EXISTS (SELECT 1 FROM post_tag pt JOIN post_tags t ON t.id = pt.post_tag_id WHERE pt.post_id = posts.id AND t.slug = ?)'
            )
            params.push(tag)
          }
          const clause = where.join(' AND ')
          const total = (await db.get(`SELECT COUNT(*)::int AS c FROM posts WHERE ${clause}`, ...params)).c
          const rows = await db.all(
            `SELECT * FROM posts WHERE ${clause} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
            ...params,
            perPage,
            offset
          )
          return {
            data: await Promise.all(rows.map((row) => serializePost(db, row, req))),
            pagination: paginationMeta(page, perPage, total),
          }
        },
        tag
      )
      res.ok(payload.data, 'OK', { pagination: payload.pagination })
    })
  )

  router.get(
    '/posts/:slug',
    wrap(async (req, res) => {
      const post = await cache.remember(
        'post',
        async () => {
          const row = await db.get(`SELECT * FROM posts WHERE ${publishedWhere} AND slug = ?`, isoNow(), req.params.slug)
          if (!row) throw new NotFoundError()
          return await serializePost(db, row, req)
        },
        req.params.slug
      )
      res.ok(post)
    })
  )

  /* ----------------------------------------------------------- publications */

  router.get(
    '/publications',
    wrap(async (req, res) => {
      const payload = await cache.remember('publications', async () => {
        const profile = await firstProfile()
        if (!profile) throw new NotFoundError()
        return (await db.all('SELECT * FROM publications WHERE profile_id = ? AND is_active = TRUE ORDER BY display_order, id', profile.id))
          .map(serializePublication)
      })
      res.ok(payload)
    })
  )

  /* --------------------------------------------------------------- services */

  router.get(
    '/services',
    wrap(async (req, res) => {
      const payload = await cache.remember('services', async () => {
        const profile = await firstProfile()
        if (!profile) throw new NotFoundError()
        return (await db.all('SELECT * FROM services WHERE profile_id = ? AND is_active = TRUE ORDER BY display_order, id', profile.id))
          .map(serializeService)
      })
      res.ok(payload)
    })
  )

  /* ----------------------------------------------------------- testimonials */

  router.get(
    '/testimonials',
    wrap(async (req, res) => {
      const payload = await cache.remember('testimonials', async () => {
        const profile = await firstProfile()
        if (!profile) throw new NotFoundError()
        return (await db.all('SELECT * FROM testimonials WHERE profile_id = ? AND is_active = TRUE ORDER BY display_order, id', profile.id))
          .map(serializeTestimonial)
      })
      res.ok(payload)
    })
  )

  /* --------------------------------------------------------------- settings */

  router.get(
    '/settings',
    wrap(async (req, res) => {
      const payload = await cache.remember('settings', async () => {
        const rows = await db.all('SELECT * FROM settings WHERE is_public = TRUE')
        const out = {}
        for (const row of rows) out[row.key] = row.value
        return out
      })
      res.ok(payload)
    })
  )

  /* ----------------------------------------------------------------- search */

  router.get(
    '/search',
    wrap(async (req, res) => {
      const q = String(req.query.q || '').trim()
      if (q.length < 2) {
        return res.ok({ query: q, projects: [], posts: [], publications: [], services: [] })
      }

      const payload = await cache.remember(
        'search',
        async () => {
          const term = `%${q}%`

          const projects = await db.all(
            `SELECT DISTINCT p.* FROM projects p
             WHERE p.is_active = TRUE AND (
               p.title ILIKE ? OR p.summary ILIKE ? OR p.description ILIKE ? OR p.category ILIKE ?
               OR (p.tech_stack IS NOT NULL
                   AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(p.tech_stack) j WHERE j = ?))
             )
             ORDER BY p.created_at DESC LIMIT 10`,
            term, term, term, term, q
          ).then((rows) => Promise.all(rows.map((row) => serializeProject(db, row, req))))

          const posts = await db.all(
            `SELECT * FROM posts
             WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= ?
               AND (title ILIKE ? OR excerpt ILIKE ? OR body ILIKE ?)
             ORDER BY published_at DESC LIMIT 10`,
            isoNow(), term, term, term
          ).then((rows) => Promise.all(rows.map((row) => serializePost(db, row, req))))

          const publications = await db.all(
            `SELECT * FROM publications
             WHERE is_active = TRUE AND (title ILIKE ? OR authors ILIKE ? OR venue ILIKE ? OR abstract ILIKE ?)
             ORDER BY created_at DESC LIMIT 8`,
            term, term, term, term
          )

          const services = await db.all(
            `SELECT * FROM services
             WHERE is_active = TRUE AND (title ILIKE ? OR summary ILIKE ? OR description ILIKE ?)
             ORDER BY display_order LIMIT 8`,
            term, term, term
          )

          return { query: q, projects, posts, publications: publications.map(serializePublication), services: services.map(serializeService) }
        },
        q.toLowerCase(),
        120
      )

      res.ok(payload)
    })
  )

  /* ---------------------------------------------------------------- writes */

  router.post(
    '/contact',
    wrap(async (req, res) => {
      const { ok, errors, values } = await validate(req.body, {
        name: ['required', 'string', 'max:255'],
        email: ['required', 'email', 'max:255'],
        phone: ['nullable', 'string', 'max:32'],
        subject: ['nullable', 'string', 'max:255'],
        message: ['required', 'string', 'min:10'],
      })
      if (!ok) throw new ValidationError(errors)

      const now = isoNow()
      await db.run(
        `INSERT INTO contact_messages (name, email, phone, subject, message, ip, device, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values.name,
        values.email,
        values.phone ?? null,
        values.subject || 'General inquiry',
        values.message,
        req.ip || null,
        String(req.headers['user-agent'] || '').slice(0, 512),
        now,
        now
      )

      res.created(null, 'Message received. Thank you for reaching out!')
    })
  )

  router.post(
    '/feedback',
    wrap(async (req, res) => {
      const { ok, errors, values } = await validate(req.body, {
        name: ['nullable', 'string', 'max:255'],
        email: ['nullable', 'email', 'max:255'],
        category: ['nullable', 'string', 'max:64'],
        rating: ['nullable', 'integer', 'min:1', 'max:5'],
        message: ['required', 'string', 'min:5'],
      })
      if (!ok) throw new ValidationError(errors)

      const now = isoNow()
      await db.run(
        `INSERT INTO feedback (name, email, category, rating, message, ip, device, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        values.name ?? null,
        values.email ?? null,
        values.category ?? null,
        values.rating ?? null,
        values.message,
        req.ip || null,
        String(req.headers['user-agent'] || '').slice(0, 512),
        now,
        now
      )

      res.created(null, 'Thank you for your feedback!')
    })
  )

  router.post(
    '/analytics',
    wrap(async (req, res) => {
      if (!config.analyticsEnabled) return res.noContent()

      const { ok, errors, values } = await validate(req.body, {
        event: ['nullable', 'string', 'max:64'],
        path: ['nullable', 'string', 'max:255'],
        referrer: ['nullable', 'string', 'max:512'],
        meta: ['nullable', 'array'],
      })
      if (!ok) throw new ValidationError(errors)

      const ip = req.ip || ''
      await db.run(
        `INSERT INTO analytics_events (event, path, referrer, user_agent, ip, meta, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        values.event || 'pageview',
        values.path ?? null,
        values.referrer ?? null,
        String(req.headers['user-agent'] || '').slice(0, 512),
        crypto.createHash('sha256').update(ip).digest('hex'),
        values.meta ? JSON.stringify(values.meta) : null,
        isoNow()
      )

      res.noContent()
    })
  )

  /* ------------------------------------------------------------------- auth */

  router.post(
    '/auth/register',
    wrap(async (req, res) => {
      const { ok, errors, values } = await validate(req.body, {
        name: ['required', 'string', 'max:255'],
        email: ['required', 'email', 'max:255', 'unique:users,email'],
        password: ['required', 'string', 'min:8', 'confirmed'],
      })
      if (!ok) throw new ValidationError(errors)

      const now = isoNow()
      const createdAt = await db.run(
        'INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        values.name,
        values.email,
        bcrypt.hashSync(values.password, 12),
        now,
        now
      )
      const userId = createdAt.id

      const token = await issueToken(db, userId, ['*'])
      res.created(
        {
          user: { id: userId, name: values.name, email: values.email, roles: [] },
          token,
        },
        'Account created.'
      )
    })
  )

  router.post(
    '/auth/login',
    wrap(async (req, res) => {
      const { ok, errors, values } = await validate(req.body, {
        email: ['required', 'email'],
        password: ['required', 'string'],
      })
      if (!ok) throw new ValidationError(errors)

      const user = await db.get('SELECT * FROM users WHERE email = ?', values.email)
      if (!user || !bcrypt.compareSync(values.password, user.password)) {
        return res.error('These credentials do not match our records.', 401)
      }

      const roles = await rolesFor(db, user.id)
      const permissions = await permissionsFor(db, user.id)
      const token = await issueToken(db, user.id, permissions)

      res.ok(
        {
          user: { id: user.id, name: user.name, email: user.email, roles, permissions },
          token,
        },
        'Welcome back.'
      )
    })
  )

  router.post(
    '/auth/logout',
    auth,
    wrap(async (req, res) => {
      await db.run("DELETE FROM personal_access_tokens WHERE tokenable_type = 'User' AND tokenable_id = ?", req.user.id)
      res.noContent()
    })
  )

  router.get(
    '/auth/me',
    auth,
    wrap(async (req, res) => {
      res.ok({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        roles: req.user.roles,
        permissions: req.user.permissions,
      })
    })
  )

  return router
}
