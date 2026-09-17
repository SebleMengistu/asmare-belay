'use strict'

const express = require('express')
const bcrypt = require('bcryptjs')
const cache = require('../lib/cache')
const config = require('../config')
const { wrap, ValidationError, NotFoundError, ApiError } = require('../lib/respond')
const { createValidator } = require('../lib/validate')
const {
  toDateString,
  toIso,
  sqliteToIso,
  isoNow,
  diffInYears,
} = require('../lib/format')
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

  const firstProfile = () =>
    db.prepare('SELECT * FROM profiles ORDER BY id LIMIT 1').get() || null

  /* ------------------------------------------------------------------ home */

  router.get(
    '/',
    wrap((req, res) => {
      const profile = firstProfile()
      if (!profile) throw new NotFoundError()

      const starts = db
        .prepare('SELECT start_date FROM experiences WHERE profile_id = ? AND is_active = 1 AND start_date IS NOT NULL')
        .all(profile.id)
        .map((row) => row.start_date)
        .filter(Boolean)
      const earliest = starts.length ? starts.reduce((a, b) => (a < b ? a : b)) : null
      const years = earliest ? diffInYears(earliest) : null

      const meta = Object.assign({}, profile.meta ? JSON.parse(profile.meta) : {}, {
        projects_completed: db
          .prepare('SELECT COUNT(*) AS c FROM projects WHERE profile_id = ? AND is_active = 1')
          .get(profile.id).c,
        research_publications: db
          .prepare('SELECT COUNT(*) AS c FROM publications WHERE profile_id = ? AND is_active = 1')
          .get(profile.id).c,
        technologies: db
          .prepare('SELECT COUNT(*) AS c FROM skills WHERE profile_id = ? AND is_active = 1')
          .get(profile.id).c,
        experience_years: years ?? (profile.meta ? JSON.parse(profile.meta).experience_years : 0) ?? 0,
      })
      profile.meta = JSON.stringify(meta)

      const featured = cache.remember(
        'featured_projects',
        () =>
          db
            .prepare(
              'SELECT * FROM projects WHERE profile_id = ? AND featured = 1 AND is_active = 1 ORDER BY display_order, created_at DESC'
            )
            .all(profile.id)
            .map((row) => serializeProject(db, row, req)),
        'index'
      )

      const recentPosts = cache.remember(
        'recent_posts',
        () =>
          db
            .prepare(
              "SELECT * FROM posts WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= ? ORDER BY published_at DESC LIMIT 3"
            )
            .all(isoNow())
            .map((row) => serializePost(db, row, req)),
        'index'
      )

      const testimonials = cache.remember(
        'testimonials',
        () =>
          db
            .prepare('SELECT * FROM testimonials WHERE profile_id = ? AND is_active = 1 ORDER BY display_order, id')
            .all(profile.id)
            .map(serializeTestimonial),
        'index'
      )

      const services = cache.remember(
        'services',
        () =>
          db
            .prepare('SELECT * FROM services WHERE profile_id = ? AND is_active = 1 ORDER BY display_order, id')
            .all(profile.id)
            .map(serializeService),
        'index'
      )

      res.ok({
        profile: serializeProfile(db, profile, req),
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
    wrap((req, res) => {
      const profile = cache.remember('profile', firstProfile)
      if (!profile) throw new NotFoundError()
      res.ok(serializeProfile(db, profile, req))
    })
  )

  router.get(
    '/profile/:id',
    wrap((req, res, next) => {
      if (!/^\d+$/.test(req.params.id)) return next()
      const profile = db.prepare('SELECT * FROM profiles WHERE id = ?').get(Number(req.params.id))
      if (!profile) throw new NotFoundError()
      res.ok(serializeProfile(db, profile, req))
    })
  )

  /* ---------------------------------------------------------------- skills */

  router.get(
    '/skills',
    wrap((req, res) => {
      const payload = cache.remember('skills', () => {
        const profile = firstProfile()
        if (!profile) throw new NotFoundError()
        return {
          skills: db
            .prepare('SELECT * FROM skills WHERE profile_id = ? AND is_active = 1 ORDER BY id')
            .all(profile.id)
            .map(serializeSkill),
          experiences: db
            .prepare('SELECT * FROM experiences WHERE profile_id = ? AND is_active = 1 ORDER BY id')
            .all(profile.id)
            .map(serializeExperience),
          educations: db
            .prepare('SELECT * FROM educations WHERE profile_id = ? AND is_active = 1 ORDER BY id')
            .all(profile.id)
            .map(serializeEducation),
          certifications: db
            .prepare('SELECT * FROM certifications WHERE profile_id = ? AND is_active = 1 ORDER BY id')
            .all(profile.id)
            .map(serializeCertification),
        }
      })
      res.ok(payload)
    })
  )

  /* -------------------------------------------------------------- projects */

  router.get(
    '/projects',
    wrap((req, res) => {
      const category = req.query.category || '_all'
      const payload = cache.remember(
        'projects',
        () => {
          const { page, perPage, offset } = pageParams(req, 12)
          const where = ['is_active = 1']
          const params = []
          if (category !== '_all') {
            where.push('category = ?')
            params.push(category)
          }
          const clause = where.join(' AND ')
          const total = db.prepare(`SELECT COUNT(*) AS c FROM projects WHERE ${clause}`).get(...params).c
          const rows = db
            .prepare(
              `SELECT * FROM projects WHERE ${clause} ORDER BY display_order, created_at DESC LIMIT ? OFFSET ?`
            )
            .all(...params, perPage, offset)
          return {
            data: rows.map((row) => serializeProject(db, row, req)),
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
    wrap((req, res) => {
      const project = cache.remember(
        'project',
        () => {
          const row = db
            .prepare('SELECT * FROM projects WHERE is_active = 1 AND slug = ?')
            .get(req.params.slug)
          if (!row) throw new NotFoundError()
          return serializeProject(db, row, req)
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
    wrap((req, res) => {
      const tag = req.query.tag || '_all'
      const payload = cache.remember(
        'posts',
        () => {
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
          const total = db
            .prepare(`SELECT COUNT(*) AS c FROM posts WHERE ${clause}`)
            .get(...params).c
          const rows = db
            .prepare(
              `SELECT * FROM posts WHERE ${clause} ORDER BY published_at DESC LIMIT ? OFFSET ?`
            )
            .all(...params, perPage, offset)
          return {
            data: rows.map((row) => serializePost(db, row, req)),
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
    wrap((req, res) => {
      const post = cache.remember(
        'post',
        () => {
          const row = db
            .prepare(`SELECT * FROM posts WHERE ${publishedWhere} AND slug = ?`)
            .get(isoNow(), req.params.slug)
          if (!row) throw new NotFoundError()
          return serializePost(db, row, req)
        },
        req.params.slug
      )
      res.ok(post)
    })
  )

  /* ----------------------------------------------------------- publications */

  router.get(
    '/publications',
    wrap((req, res) => {
      const payload = cache.remember('publications', () => {
        const profile = firstProfile()
        if (!profile) throw new NotFoundError()
        return db
          .prepare('SELECT * FROM publications WHERE profile_id = ? AND is_active = 1 ORDER BY display_order, id')
          .all(profile.id)
          .map(serializePublication)
      })
      res.ok(payload)
    })
  )

  /* --------------------------------------------------------------- services */

  router.get(
    '/services',
    wrap((req, res) => {
      const payload = cache.remember('services', () => {
        const profile = firstProfile()
        if (!profile) throw new NotFoundError()
        return db
          .prepare('SELECT * FROM services WHERE profile_id = ? AND is_active = 1 ORDER BY display_order, id')
          .all(profile.id)
          .map(serializeService)
      })
      res.ok(payload)
    })
  )

  /* ----------------------------------------------------------- testimonials */

  router.get(
    '/testimonials',
    wrap((req, res) => {
      const payload = cache.remember('testimonials', () => {
        const profile = firstProfile()
        if (!profile) throw new NotFoundError()
        return db
          .prepare('SELECT * FROM testimonials WHERE profile_id = ? AND is_active = 1 ORDER BY display_order, id')
          .all(profile.id)
          .map(serializeTestimonial)
      })
      res.ok(payload)
    })
  )

  /* --------------------------------------------------------------- settings */

  router.get(
    '/settings',
    wrap((req, res) => {
      const payload = cache.remember('settings', () => {
        const out = {}
        for (const row of db.prepare('SELECT * FROM settings WHERE is_public = 1').all()) {
          out[row.key] = row.value
        }
        return out
      })
      res.ok(payload)
    })
  )

  /* ----------------------------------------------------------------- search */

  router.get(
    '/search',
    wrap((req, res) => {
      const q = String(req.query.q || '').trim()
      if (q.length < 2) {
        return res.ok({ query: q, projects: [], posts: [], publications: [], services: [] })
      }

      const payload = cache.remember(
        'search',
        () => {
          const term = `%${q}%`

          const projects = db
            .prepare(
              `SELECT DISTINCT p.* FROM projects p
               WHERE p.is_active = 1 AND (
                 p.title LIKE ? OR p.summary LIKE ? OR p.description LIKE ? OR p.category LIKE ?
                 OR (p.tech_stack IS NOT NULL AND json_valid(p.tech_stack)
                     AND EXISTS (SELECT 1 FROM json_each(p.tech_stack) j WHERE j.value = ?))
               )
               ORDER BY p.created_at DESC LIMIT 10`
            )
            .all(term, term, term, term, q)
            .map((row) => serializeProject(db, row, req))

          const posts = db
            .prepare(
              `SELECT * FROM posts
               WHERE status = 'published' AND published_at IS NOT NULL AND published_at <= ?
                 AND (title LIKE ? OR excerpt LIKE ? OR body LIKE ?)
               ORDER BY published_at DESC LIMIT 10`
            )
            .all(isoNow(), term, term, term)
            .map((row) => serializePost(db, row, req))

          const publications = db
            .prepare(
              `SELECT * FROM publications
               WHERE is_active = 1 AND (title LIKE ? OR authors LIKE ? OR venue LIKE ? OR abstract LIKE ?)
               ORDER BY created_at DESC LIMIT 8`
            )
            .all(term, term, term, term)
            .map(serializePublication)

          const services = db
            .prepare(
              `SELECT * FROM services
               WHERE is_active = 1 AND (title LIKE ? OR summary LIKE ? OR description LIKE ?)
               ORDER BY display_order LIMIT 8`
            )
            .all(term, term, term)
            .map(serializeService)

          return { query: q, projects, posts, publications, services }
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
    wrap((req, res) => {
      const { ok, errors, values } = validate(req.body, {
        name: ['required', 'string', 'max:255'],
        email: ['required', 'email', 'max:255'],
        phone: ['nullable', 'string', 'max:32'],
        subject: ['nullable', 'string', 'max:255'],
        message: ['required', 'string', 'min:10'],
      })
      if (!ok) throw new ValidationError(errors)

      const now = isoNow()
      db.prepare(
        `INSERT INTO contact_messages (name, email, phone, subject, message, ip, device, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
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
    wrap((req, res) => {
      const { ok, errors, values } = validate(req.body, {
        name: ['nullable', 'string', 'max:255'],
        email: ['nullable', 'email', 'max:255'],
        category: ['nullable', 'string', 'max:64'],
        rating: ['nullable', 'integer', 'min:1', 'max:5'],
        message: ['required', 'string', 'min:5'],
      })
      if (!ok) throw new ValidationError(errors)

      const now = isoNow()
      db.prepare(
        `INSERT INTO feedback (name, email, category, rating, message, ip, device, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
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
    wrap((req, res) => {
      if (!config.analyticsEnabled) return res.noContent()

      const { ok, errors, values } = validate(req.body, {
        event: ['nullable', 'string', 'max:64'],
        path: ['nullable', 'string', 'max:255'],
        referrer: ['nullable', 'string', 'max:512'],
        meta: ['nullable', 'array'],
      })
      if (!ok) throw new ValidationError(errors)

      const ip = req.ip || ''
      db.prepare(
        `INSERT INTO analytics_events (event, path, referrer, user_agent, ip, meta, occurred_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(
        values.event || 'pageview',
        values.path ?? null,
        values.referrer ?? null,
        String(req.headers['user-agent'] || '').slice(0, 512),
        require('crypto').createHash('sha256').update(ip).digest('hex'),
        values.meta ? JSON.stringify(values.meta) : null,
        isoNow()
      )

      res.noContent()
    })
  )

  /* ------------------------------------------------------------------- auth */

  router.post(
    '/auth/register',
    wrap((req, res) => {
      const { ok, errors, values } = validate(req.body, {
        name: ['required', 'string', 'max:255'],
        email: ['required', 'email', 'max:255', 'unique:users,email'],
        password: ['required', 'string', 'min:8', 'confirmed'],
      })
      if (!ok) throw new ValidationError(errors)

      const now = isoNow()
      db.prepare(
        'INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
      ).run(values.name, values.email, bcrypt.hashSync(values.password, 12), now, now)
      const userId = Number(db.prepare('SELECT id FROM users WHERE email = ?').get(values.email).id)

      const token = issueToken(db, userId, ['*'])
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
    wrap((req, res) => {
      const { ok, errors, values } = validate(req.body, {
        email: ['required', 'email'],
        password: ['required', 'string'],
      })
      if (!ok) throw new ValidationError(errors)

      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(values.email)
      if (!user || !bcrypt.compareSync(values.password, user.password)) {
        return res.error('These credentials do not match our records.', 401)
      }

      const roles = rolesFor(db, user.id)
      const permissions = permissionsFor(db, user.id)
      const token = issueToken(db, user.id, permissions)

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
    wrap((req, res) => {
      db.prepare("DELETE FROM personal_access_tokens WHERE tokenable_type = 'User' AND tokenable_id = ?").run(
        req.user.id
      )
      res.noContent()
    })
  )

  router.get(
    '/auth/me',
    auth,
    wrap((req, res) => {
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
