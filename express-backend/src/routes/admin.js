'use strict'

const express = require('express')
const cache = require('../lib/cache')
const { wrap, ValidationError, NotFoundError } = require('../lib/respond')
const { createValidator, fileError } = require('../lib/validate')
const {
  toBoolean,
  toInt,
  toFloat,
  toJsonColumn,
  normalizeUrl,
  uniqueSlug,
  isoNow,
  toIso,
  sqliteToIso,
} = require('../lib/format')
const { requireAuth, requireAdmin } = require('../lib/auth')
const { lastInsertId } = require('../lib/db')
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
  serializeContactMessage,
  serializeFeedback,
} = require('../lib/serialize')
const {
  storeUpload,
  mediaRows,
  mediaUrl,
  mediaVariantUrl,
  clearMediaCollection,
  deleteMediaRow,
} = require('../lib/media')

const SKILL_CATEGORIES =
  'frontend,backend,database,tools,teaching,security,networking,lms,odoo,general'

const SIDE_EFFECT_KEYS = new Set([
  'skill_ids',
  'tags',
  'media',
  'cover',
  'avatar',
  'resume',
  'password_confirmation',
])

function startOfDay(dateStr) {
  return `${String(dateStr).slice(0, 10)}T00:00:00.000Z`
}
function endOfDay(dateStr) {
  return `${String(dateStr).slice(0, 10)}T23:59:59.999Z`
}

module.exports = function createAdminRouter(db) {
  const router = express.Router()
  const validate = createValidator(db)
  const auth = requireAuth(db)

  router.use(auth, requireAdmin)

  const columnCache = new Map()
  function hasColumn(table, column) {
    const key = `${table}.${column}`
    if (!columnCache.has(key)) {
      const cols = db
        .prepare(`PRAGMA table_info(${table})`)
        .all()
        .map((row) => row.name)
      columnCache.set(key, cols.includes(column))
    }
    return columnCache.get(key)
  }

  function firstProfileId() {
    const row = db.prepare('SELECT id FROM profiles ORDER BY id LIMIT 1').get()
    return row ? row.id : null
  }

  function listRows(table, req) {
    const search = String(req.query.search || '').trim()
    let where = ''
    const params = []
    if (search !== '') {
      const columns = ['title', 'name'].filter((column) => hasColumn(table, column))
      if (columns.length > 0) {
        where = `WHERE ${columns.map((column) => `${column} LIKE ?`).join(' OR ')}`
        for (const _ of columns) params.push(`%${search}%`)
      }
    }
    return db.prepare(`SELECT * FROM ${table} ${where} ORDER BY created_at DESC`).all(...params)
  }

  function storeRow(table, columns) {
    const keys = Object.keys(columns)
    const now = isoNow()
    if (hasColumn(table, 'created_at')) {
      columns.created_at = now
      columns.updated_at = now
      if (!keys.includes('created_at')) keys.push('created_at', 'updated_at')
    }
    const allKeys = Object.keys(columns)
    const placeholders = allKeys.map(() => '?').join(', ')
    db.prepare(
      `INSERT INTO ${table} (${allKeys.map((k) => `"${k}"`).join(', ')}) VALUES (${placeholders})`
    ).run(...allKeys.map((key) => columns[key]))
    return lastInsertId(db)
  }

  function updateRow(table, id, columns) {
    const keys = Object.keys(columns)
    if (hasColumn(table, 'updated_at')) {
      columns.updated_at = isoNow()
      if (!keys.includes('updated_at')) keys.push('updated_at')
    }
    const allKeys = Object.keys(columns)
    if (allKeys.length === 0) return
    const assignments = allKeys.map((key) => `"${key}" = ?`).join(', ')
    db.prepare(`UPDATE ${table} SET ${assignments} WHERE id = ?`).run(
      ...allKeys.map((key) => columns[key]),
      id
    )
  }

  function findOrFail(table, id) {
    const row = db.prepare(`SELECT * FROM ${table} WHERE id = ?`).get(Number(id))
    if (!row) throw new NotFoundError()
    return row
  }

  function buildColumns(values, cfg) {
    const columns = {}
    for (const [key, value] of Object.entries(values)) {
      if (SIDE_EFFECT_KEYS.has(key)) continue
      if (cfg.json && cfg.json.includes(key)) {
        columns[key] = value === null || value === undefined ? null : toJsonColumn(value)
      } else if (cfg.boolean && cfg.boolean.includes(key)) {
        const bool = toBoolean(value)
        columns[key] = bool === null ? null : bool ? 1 : 0
      } else if (cfg.integer && cfg.integer.includes(key)) {
        columns[key] = toInt(value)
      } else if (cfg.float && cfg.float.includes(key)) {
        columns[key] = toFloat(value)
      } else {
        columns[key] = value
      }
    }
    return columns
  }

  /* ------------------------------------------------------------- dashboard */

  router.get(
    '/dashboard',
    wrap((req, res) => {
      const profile = db.prepare('SELECT * FROM profiles ORDER BY id LIMIT 1').get()
      res.ok({
        counts: {
          projects: db.prepare('SELECT COUNT(*) AS c FROM projects').get().c,
          posts: db.prepare('SELECT COUNT(*) AS c FROM posts').get().c,
          published_posts: db
            .prepare("SELECT COUNT(*) AS c FROM posts WHERE status = 'published'")
            .get().c,
          messages: db.prepare('SELECT COUNT(*) AS c FROM contact_messages').get().c,
          unread_messages: db
            .prepare('SELECT COUNT(*) AS c FROM contact_messages WHERE read_at IS NULL')
            .get().c,
        },
        profile: profile
          ? {
              id: profile.id,
              display_name: profile.display_name,
              headline: profile.headline,
              available_for_work: toBoolean(profile.available_for_work),
            }
          : null,
        recent_messages: db
          .prepare(
            'SELECT id, name, email, subject, read_at, created_at FROM contact_messages ORDER BY created_at DESC, id DESC LIMIT 5'
          )
          .all()
          .map((row) => ({
            id: row.id,
            name: row.name,
            email: row.email,
            subject: row.subject,
            read_at: toIso(sqliteToIso(row.read_at)),
            created_at: toIso(sqliteToIso(row.created_at)),
          })),
      })
    })
  )

  /* ------------------------------------------------------------- analytics */

  router.get(
    '/analytics/overview',
    wrap((req, res) => {
      const fromStr = req.query.from
      const toStr = req.query.to
      const range =
        fromStr && toStr
          ? { from: startOfDay(fromStr), to: endOfDay(toStr), fromDate: String(fromStr).slice(0, 10), toDate: String(toStr).slice(0, 10) }
          : null

      const rangeClause = range ? 'WHERE occurred_at BETWEEN ? AND ?' : ''
      const rangeParams = range ? [range.from, range.to] : []

      const pageviews = db
        .prepare(`SELECT COUNT(*) AS c FROM analytics_events ${rangeClause ? rangeClause + ' AND' : 'WHERE'} event = 'pageview'`)
        .get(...rangeParams).c
      const uniqueVisitors = db
        .prepare(
          `SELECT COUNT(DISTINCT ip) AS c FROM analytics_events ${
            rangeClause ? rangeClause + ' AND' : 'WHERE'
          } event = 'pageview'`
        )
        .get(...rangeParams).c

      const countEvent = (event) =>
        db
          .prepare(`SELECT COUNT(*) AS c FROM analytics_events ${rangeClause ? rangeClause + ' AND' : 'WHERE'} event = ?`)
          .get(...rangeParams, event).c

      const outbound = {
        github_click: countEvent('github_click'),
        linkedin_click: countEvent('linkedin_click'),
        email_click: countEvent('email_click'),
        telegram_click: countEvent('telegram_click'),
        demo_click: countEvent('demo_click'),
        cv_download: countEvent('cv_download'),
        contact_form_submit: countEvent('contact_form_submit'),
        feedback_submit: countEvent('feedback_submit'),
      }

      const topPages = db
        .prepare(
          `SELECT path, COUNT(*) AS total FROM analytics_events ${
            rangeClause ? rangeClause + ' AND' : 'WHERE'
          } event = 'pageview' AND path IS NOT NULL GROUP BY path ORDER BY total DESC LIMIT 10`
        )
        .all(...rangeParams)

      const trendFrom = range ? range.from : startOfDay(new Date(Date.now() - 13 * 86400000).toISOString())
      const trendTo = range ? range.to : endOfDay(new Date().toISOString())
      const trend = db
        .prepare(
          `SELECT date(occurred_at) AS day,
                  SUM(CASE WHEN event = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
                  COUNT(*) AS total
           FROM analytics_events WHERE occurred_at BETWEEN ? AND ?
           GROUP BY day ORDER BY day`
        )
        .all(trendFrom, trendTo)
        .map((row) => ({ date: String(row.day), pageviews: Number(row.pageviews), events: Number(row.total) }))

      const countContacts = () =>
        range
          ? db
              .prepare('SELECT COUNT(*) AS c FROM contact_messages WHERE created_at BETWEEN ? AND ?')
              .get(range.from, range.to).c
          : db.prepare('SELECT COUNT(*) AS c FROM contact_messages').get().c
      const countFeedback = () =>
        range
          ? db
              .prepare('SELECT COUNT(*) AS c FROM feedback WHERE created_at BETWEEN ? AND ?')
              .get(range.from, range.to).c
          : db.prepare('SELECT COUNT(*) AS c FROM feedback').get().c

      res.ok({
        range: range ? { from: range.fromDate, to: range.toDate } : null,
        totals: {
          pageviews,
          unique_visitors: uniqueVisitors,
          contacts: countContacts(),
          feedback: countFeedback(),
        },
        outbound,
        top_pages: topPages,
        trend,
      })
    })
  )

  /* --------------------------------------------------------------- profile */

  router.get(
    '/profile',
    wrap((req, res) => {
      res.ok(db.prepare('SELECT * FROM profiles ORDER BY id').all().map((row) => serializeProfile(db, row, req)))
    })
  )

  router.get(
    '/profiles',
    wrap((req, res) => {
      res.ok(db.prepare('SELECT * FROM profiles ORDER BY id').all().map((row) => serializeProfile(db, row, req)))
    })
  )

  router.get(
    '/profiles/:id',
    wrap((req, res) => {
      res.ok(serializeProfile(db, findOrFail('profiles', req.params.id), req))
    })
  )

  const updateProfile = wrap(async (req, res) => {
    const profile = findOrFail('profiles', req.params.id)

    const { ok, errors, values } = validate(req.body, {
      first_name: ['nullable', 'string', 'max:255'],
      last_name: ['nullable', 'string', 'max:255'],
      display_name: ['nullable', 'string', 'max:255'],
      headline: ['nullable', 'string', 'max:255'],
      tagline: ['nullable', 'string', 'max:500'],
      bio: ['nullable', 'string'],
      location: ['nullable', 'string', 'max:255'],
      website: ['nullable', 'url', 'max:255'],
      email_public: ['nullable', 'email', 'max:255'],
      phone: ['nullable', 'string', 'max:32'],
      github: ['nullable', 'url', 'max:255'],
      linkedin: ['nullable', 'url', 'max:255'],
      twitter: ['nullable', 'url', 'max:255'],
      whatsapp: ['nullable', 'string', 'max:32'],
      roles: ['nullable', 'array'],
      available_for_work: ['nullable', 'boolean'],
      meta: ['nullable', 'array'],
    })

    const files = req.uploads || {}
    const avatar = files.avatar ? files.avatar[0] : null
    const cover = files.cover ? files.cover[0] : null
    const resume = files.resume ? files.resume[0] : null

    const fileErrors = {}
    if (avatar) {
      const err = fileError(avatar, { label: 'avatar', imagesOnly: true, maxKb: 4096, mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] })
      if (err.length) fileErrors.avatar = err
    }
    if (cover) {
      const err = fileError(cover, { label: 'cover', imagesOnly: true, maxKb: 8192, mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] })
      if (err.length) fileErrors.cover = err
    }
    if (resume) {
      const err = fileError(resume, {
        label: 'resume',
        maxKb: 5120,
        mimes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      })
      if (err.length) fileErrors.resume = err
    }
    if (!ok || Object.keys(fileErrors).length) {
      throw new ValidationError({ ...errors, ...fileErrors })
    }

    const columns = buildColumns(values, {
      json: ['roles', 'meta'],
      boolean: ['available_for_work'],
    })
    updateRow('profiles', profile.id, columns)

    if (avatar) {
      clearMediaCollection(db, 'Profile', profile.id, 'avatar')
      await storeUpload(db, { model_type: 'Profile', model_id: profile.id, collection_name: 'avatar', file: avatar, name: 'avatar' })
    }
    if (cover) {
      clearMediaCollection(db, 'Profile', profile.id, 'cover')
      await storeUpload(db, { model_type: 'Profile', model_id: profile.id, collection_name: 'cover', file: cover, name: 'cover' })
    }
    if (resume) {
      clearMediaCollection(db, 'Profile', profile.id, 'resume')
      await storeUpload(db, { model_type: 'Profile', model_id: profile.id, collection_name: 'resume', file: resume, name: 'resume' })
    }

    cache.flush()
    res.ok(serializeProfile(db, findOrFail('profiles', profile.id), req), 'Profile updated.')
  })

  router.put('/profile/:id', updateProfile)
  router.put('/profiles/:id', updateProfile)

  /* -------------------------------------------------- simple CRUD catalog */

  const SIMPLE = [
    {
      name: 'skills',
      table: 'skills',
      singular: 'Skill',
      serialize: serializeSkill,
      profileScoped: true,
      rules: (isUpdate) => ({
        name: isUpdate ? ['sometimes', 'string', 'max:255'] : ['required', 'string', 'max:255'],
        category: ['nullable', 'string', 'max:64', `in:${SKILL_CATEGORIES}`],
        level: ['nullable', 'integer', 'min:0', 'max:100'],
        icon: ['nullable', 'string', 'max:64'],
        color: ['nullable', 'string', 'max:32'],
        display_order: ['nullable', 'integer'],
        is_active: ['nullable', 'boolean'],
      }),
      columns: { integer: ['level', 'display_order'], boolean: ['is_active'] },
    },
    {
      name: 'experiences',
      table: 'experiences',
      singular: 'Experience',
      serialize: serializeExperience,
      profileScoped: true,
      normalize: ['company_url'],
      rules: () => ({
        title: ['required', 'string', 'max:255'],
        company: ['required', 'string', 'max:255'],
        company_url: ['nullable', 'url', 'max:255'],
        location: ['nullable', 'string', 'max:255'],
        start_date: ['required', 'date'],
        end_date: ['nullable', 'date', 'after_or_equal:start_date'],
        current: ['nullable', 'boolean'],
        description: ['nullable', 'string'],
        highlights: ['nullable', 'array'],
        display_order: ['nullable', 'integer'],
        is_active: ['nullable', 'boolean'],
      }),
      columns: { json: ['highlights'], integer: ['display_order'], boolean: ['current', 'is_active'] },
    },
    {
      name: 'educations',
      table: 'educations',
      singular: 'Education',
      serialize: serializeEducation,
      profileScoped: true,
      rules: () => ({
        degree: ['required', 'string', 'max:255'],
        field_of_study: ['nullable', 'string', 'max:255'],
        institution: ['required', 'string', 'max:255'],
        location: ['nullable', 'string', 'max:255'],
        start_date: ['nullable', 'date'],
        end_date: ['nullable', 'date', 'after_or_equal:start_date'],
        grade: ['nullable', 'string', 'max:64'],
        description: ['nullable', 'string'],
        display_order: ['nullable', 'integer'],
        is_active: ['nullable', 'boolean'],
      }),
      columns: { integer: ['display_order'], boolean: ['is_active'] },
    },
    {
      name: 'certifications',
      table: 'certifications',
      singular: 'Certification',
      serialize: serializeCertification,
      profileScoped: true,
      normalize: ['credential_url'],
      rules: () => ({
        name: ['required', 'string', 'max:255'],
        issuer: ['required', 'string', 'max:255'],
        credential_url: ['nullable', 'url', 'max:255'],
        credential_id: ['nullable', 'string', 'max:255'],
        issued_date: ['nullable', 'date'],
        expiry_date: ['nullable', 'date', 'after_or_equal:issued_date'],
        skills: ['nullable', 'array'],
        image: ['nullable', 'string'],
        display_order: ['nullable', 'integer'],
        is_active: ['nullable', 'boolean'],
      }),
      columns: { json: ['skills'], integer: ['display_order'], boolean: ['is_active'] },
    },
    {
      name: 'publications',
      table: 'publications',
      singular: 'Publication',
      serialize: serializePublication,
      profileScoped: true,
      normalize: ['url'],
      rules: () => ({
        title: ['required', 'string', 'max:255'],
        authors: ['nullable', 'string', 'max:500'],
        venue: ['nullable', 'string', 'max:255'],
        type: ['nullable', 'string', 'max:64'],
        year: ['nullable', 'string', 'max:16'],
        url: ['nullable', 'url'],
        doi: ['nullable', 'string', 'max:255'],
        abstract: ['nullable', 'string'],
        display_order: ['nullable', 'integer'],
        is_active: ['nullable', 'boolean'],
      }),
      columns: { integer: ['display_order'], boolean: ['is_active'] },
    },
    {
      name: 'services',
      table: 'services',
      singular: 'Service',
      serialize: serializeService,
      profileScoped: true,
      rules: () => ({
        title: ['required', 'string', 'max:255'],
        summary: ['nullable', 'string', 'max:500'],
        description: ['nullable', 'string'],
        icon: ['nullable', 'string', 'max:64'],
        price_from: ['nullable', 'numeric', 'min:0'],
        currency: ['nullable', 'string', 'max:8'],
        delivery: ['nullable', 'string', 'max:255'],
        features: ['nullable', 'array'],
        cta_label: ['nullable', 'string', 'max:255'],
        display_order: ['nullable', 'integer'],
        is_active: ['nullable', 'boolean'],
      }),
      columns: { json: ['features'], float: ['price_from'], integer: ['display_order'], boolean: ['is_active'] },
    },
    {
      name: 'testimonials',
      table: 'testimonials',
      singular: 'Testimonial',
      serialize: serializeTestimonial,
      profileScoped: true,
      rules: () => ({
        name: ['required', 'string', 'max:255'],
        role: ['nullable', 'string', 'max:255'],
        company: ['nullable', 'string', 'max:255'],
        quote: ['required', 'string', 'min:10'],
        rating: ['nullable', 'integer', 'min:1', 'max:5'],
        display_order: ['nullable', 'integer'],
        is_active: ['nullable', 'boolean'],
      }),
      columns: { integer: ['rating', 'display_order'], boolean: ['is_active'] },
    },
  ]

  for (const cfg of SIMPLE) {
    router.get(
      `/${cfg.name}`,
      wrap((req, res) => {
        res.ok(listRows(cfg.table, req).map(cfg.serialize))
      })
    )

    router.get(
      `/${cfg.name}/:id`,
      wrap((req, res) => {
        res.ok(cfg.serialize(findOrFail(cfg.table, req.params.id)))
      })
    )

    router.post(
      `/${cfg.name}`,
      wrap((req, res) => {
        if (cfg.normalize) {
          for (const key of cfg.normalize) {
            if (Object.prototype.hasOwnProperty.call(req.body, key)) {
              req.body[key] = normalizeUrl(req.body[key])
            }
          }
        }
        const { ok, errors, values } = validate(req.body, cfg.rules(false))
        if (!ok) throw new ValidationError(errors)

        const columns = buildColumns(values, cfg.columns)
        if (cfg.profileScoped && hasColumn(cfg.table, 'profile_id')) {
          columns.profile_id = firstProfileId()
        }
        if (hasColumn(cfg.table, 'slug')) {
          columns.slug = uniqueSlug(
            db,
            cfg.table,
            values.slug && String(values.slug).trim() !== '' ? values.slug : values.title
          )
        }
        const id = storeRow(cfg.table, columns)
        cache.flush()
        res.created(cfg.serialize(findOrFail(cfg.table, id)), `${cfg.singular} created.`)
      })
    )

    const update = wrap((req, res) => {
      const existing = findOrFail(cfg.table, req.params.id)
      if (cfg.normalize) {
        for (const key of cfg.normalize) {
          if (Object.prototype.hasOwnProperty.call(req.body, key)) {
            req.body[key] = normalizeUrl(req.body[key])
          }
        }
      }
      const { ok, errors, values } = validate(req.body, cfg.rules(true))
      if (!ok) throw new ValidationError(errors)

      const columns = buildColumns(values, cfg.columns)
      if (hasColumn(cfg.table, 'slug')) {
        const base =
          values.slug && String(values.slug).trim() !== '' ? values.slug : values.title || existing.title
        columns.slug = uniqueSlug(db, cfg.table, base, existing.id)
      }
      updateRow(cfg.table, existing.id, columns)
      cache.flush()
      res.ok(cfg.serialize(findOrFail(cfg.table, existing.id)), `${cfg.singular} updated.`)
    })

    router.put(`/${cfg.name}/:id`, update)

    router.delete(
      `/${cfg.name}/:id`,
      wrap((req, res) => {
        const row = findOrFail(cfg.table, req.params.id)
        db.prepare(`DELETE FROM ${cfg.table} WHERE id = ?`).run(row.id)
        cache.flush()
        res.noContent('Deleted')
      })
    )
  }

  /* -------------------------------------------------------------- projects */

  const projectRules = (isUpdate) => ({
    title: isUpdate ? ['sometimes', 'string', 'max:255'] : ['required', 'string', 'max:255'],
    slug: isUpdate
      ? ['sometimes', 'string', 'max:255']
      : ['nullable', 'string', 'max:255'],
    summary: ['nullable', 'string', 'max:500'],
    description: ['nullable', 'string'],
    category: ['nullable', 'string', 'max:100'],
    repo_url: ['nullable', 'url', 'max:255'],
    demo_url: ['nullable', 'url', 'max:255'],
    tech_stack: ['nullable', 'array'],
    featured: ['nullable', 'boolean'],
    start_date: ['nullable', 'date'],
    end_date: ['nullable', 'date', 'after_or_equal:start_date'],
    is_active: ['nullable', 'boolean'],
    skill_ids: ['nullable', 'array'],
  })

  function syncProjectSkills(projectId, skillIds) {
    db.prepare('DELETE FROM project_skill WHERE project_id = ?').run(projectId)
    if (!Array.isArray(skillIds)) return
    const insert = db.prepare('INSERT OR IGNORE INTO project_skill (project_id, skill_id) VALUES (?, ?)')
    for (const skillId of skillIds) {
      const id = toInt(skillId)
      if (id === null) continue
      const exists = db.prepare('SELECT 1 FROM skills WHERE id = ?').get(id)
      if (!exists) throw new ValidationError({ 'skill_ids.0': ['The selected skill ids is invalid.'] })
      insert.run(projectId, id)
    }
  }

  function validateProjectMedia(files) {
    const uploads = files || []
    for (let i = 0; i < uploads.length; i += 1) {
      const err = fileError(uploads[i], { label: `media.${i}`, imagesOnly: true, maxKb: 10240 })
      if (err.length) throw new ValidationError({ [`media.${i}`]: err })
    }
  }

  router.get(
    '/projects',
    wrap((req, res) => {
      res.ok(listRows('projects', req).map((row) => serializeProject(db, row, req)))
    })
  )

  router.get(
    '/projects/:id',
    wrap((req, res) => {
      res.ok(serializeProject(db, findOrFail('projects', req.params.id), req))
    })
  )

  router.post(
    '/projects',
    wrap(async (req, res) => {
      for (const key of ['repo_url', 'demo_url']) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          req.body[key] = normalizeUrl(req.body[key])
        }
      }
      const { ok, errors, values } = validate(req.body, projectRules(false))
      if (!ok) throw new ValidationError(errors)

      const slug =
        values.slug && String(values.slug).trim() !== ''
          ? values.slug
          : uniqueSlug(db, 'projects', values.title)

      const columns = buildColumns(values, {
        json: ['tech_stack'],
        boolean: ['featured', 'is_active'],
      })
      delete columns.slug
      columns.slug = slug
      columns.profile_id = null
      const id = storeRow('projects', columns)

      const skillIds = Object.prototype.hasOwnProperty.call(req.body, 'skill_ids')
        ? req.body.skill_ids
        : []
      syncProjectSkills(id, skillIds)

      const media = (req.uploads && req.uploads.media) || []
      validateProjectMedia(media)
      for (const file of media) {
        await storeUpload(db, { model_type: 'Project', model_id: id, collection_name: 'screenshots', file })
      }

      cache.flush()
      res.created(serializeProject(db, findOrFail('projects', id), req), 'Project created.')
    })
  )

  router.put(
    '/projects/:id',
    wrap(async (req, res) => {
      const existing = findOrFail('projects', req.params.id)
      for (const key of ['repo_url', 'demo_url']) {
        if (Object.prototype.hasOwnProperty.call(req.body, key)) {
          req.body[key] = normalizeUrl(req.body[key])
        }
      }
      const { ok, errors, values } = validate(req.body, projectRules(true))
      if (!ok) throw new ValidationError(errors)

      if (Object.prototype.hasOwnProperty.call(values, 'slug')) {
        values.slug =
          values.slug && String(values.slug).trim() !== ''
            ? values.slug
            : uniqueSlug(db, 'projects', values.title || existing.title, existing.id)
      }

      const columns = buildColumns(values, {
        json: ['tech_stack'],
        boolean: ['featured', 'is_active'],
      })
      updateRow('projects', existing.id, columns)

      if (Object.prototype.hasOwnProperty.call(req.body, 'skill_ids')) {
        syncProjectSkills(existing.id, req.body.skill_ids)
      }

      const media = (req.uploads && req.uploads.media) || []
      validateProjectMedia(media)
      for (const file of media) {
        await storeUpload(db, { model_type: 'Project', model_id: existing.id, collection_name: 'screenshots', file })
      }

      cache.flush()
      res.ok(serializeProject(db, findOrFail('projects', existing.id), req), 'Project updated.')
    })
  )

  router.delete(
    '/projects/:id',
    wrap((req, res) => {
      const existing = findOrFail('projects', req.params.id)
      for (const media of mediaRows(db, 'Project', existing.id)) deleteMediaRow(db, media)
      db.prepare('DELETE FROM project_skill WHERE project_id = ?').run(existing.id)
      db.prepare('DELETE FROM projects WHERE id = ?').run(existing.id)
      cache.flush()
      res.noContent('Deleted')
    })
  )

  /* ----------------------------------------------------------------- posts */

  const postRules = {
    title: ['required', 'string', 'max:255'],
    body: ['required', 'string'],
    excerpt: ['nullable', 'string', 'max:500'],
    meta_title: ['nullable', 'string', 'max:255'],
    meta_description: ['nullable', 'string', 'max:500'],
    status: ['nullable', 'string', 'in:draft,published'],
    published_at: ['nullable', 'date'],
    tags: ['nullable', 'array'],
  }

  function syncPostTags(postId, tags) {
    const ids = []
    const findOrCreate = db.prepare('SELECT id FROM post_tags WHERE slug = ?')
    const insertTag = db.prepare('INSERT INTO post_tags (name, slug, created_at, updated_at) VALUES (?, ?, ?, ?)')
    for (const tag of Array.isArray(tags) ? tags : []) {
      const name = typeof tag === 'object' && tag !== null ? tag.name || tag.slug : tag
      if (!name) continue
      const slug = require('../lib/format').slugify(name)
      if (!slug) continue
      let row = findOrCreate.get(slug)
      if (!row) {
        const now = isoNow()
        insertTag.run(String(name), slug, now, now)
        row = findOrCreate.get(slug)
      }
      ids.push(row.id)
    }
    db.prepare('DELETE FROM post_tag WHERE post_id = ?').run(postId)
    const link = db.prepare('INSERT OR IGNORE INTO post_tag (post_id, post_tag_id) VALUES (?, ?)')
    for (const id of ids) link.run(postId, id)
  }

  function validatePostCover(file) {
    if (!file) return
    const err = fileError(file, {
      label: 'cover',
      imagesOnly: true,
      maxKb: 10240,
      mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    })
    if (err.length) throw new ValidationError({ cover: err })
  }

  router.get(
    '/posts',
    wrap((req, res) => {
      res.ok(listRows('posts', req).map((row) => serializePost(db, row, req)))
    })
  )

  router.get(
    '/posts/:id',
    wrap((req, res) => {
      res.ok(serializePost(db, findOrFail('posts', req.params.id), req))
    })
  )

  router.post(
    '/posts',
    wrap(async (req, res) => {
      const body = { ...req.body }
      if (Object.prototype.hasOwnProperty.call(body, 'slug')) {
        const slugRule = body.slug && String(body.slug).trim() !== ''
          ? ['nullable', 'string', 'max:255', 'unique:posts,slug']
          : ['nullable', 'string', 'max:255']
        body.slug = slugRule
      }
      const { ok, errors, values } = validate(req.body, {
        ...postRules,
        slug: ['nullable', 'string', 'max:255', 'unique:posts,slug'],
        cover: ['nullable'],
      })
      if (!ok) throw new ValidationError(errors)

      const cover = (req.uploads && req.uploads.cover && req.uploads.cover[0]) || null
      validatePostCover(cover)

      const columns = buildColumns(values, {})
      delete columns.tags
      delete columns.cover
      columns.slug =
        values.slug && String(values.slug).trim() !== ''
          ? values.slug
          : uniqueSlug(db, 'posts', values.title)
      columns.published_at = (values.status || 'draft') === 'published' ? isoNow() : null
      const id = storeRow('posts', columns)

      syncPostTags(id, Object.prototype.hasOwnProperty.call(req.body, 'tags') ? req.body.tags : [])

      if (cover) {
        await storeUpload(db, { model_type: 'Post', model_id: id, collection_name: 'cover', file: cover })
      }

      cache.flush()
      res.created(serializePost(db, findOrFail('posts', id), req), 'Post created.')
    })
  )

  router.put(
    '/posts/:id',
    wrap(async (req, res) => {
      const existing = findOrFail('posts', req.params.id)
      const { ok, errors, values } = validate(req.body, {
        title: ['sometimes', 'string', 'max:255'],
        body: ['sometimes', 'string'],
        slug: ['nullable', 'string', 'max:255', `unique:posts,slug,${existing.id}`],
        excerpt: ['nullable', 'string', 'max:500'],
        meta_title: ['nullable', 'string', 'max:255'],
        meta_description: ['nullable', 'string', 'max:500'],
        status: ['nullable', 'string', 'in:draft,published'],
        published_at: ['nullable', 'date'],
        tags: ['nullable', 'array'],
      })
      if (!ok) throw new ValidationError(errors)

      const cover = (req.uploads && req.uploads.cover && req.uploads.cover[0]) || null
      validatePostCover(cover)

      const columns = buildColumns(values, {})
      delete columns.tags
      if (Object.prototype.hasOwnProperty.call(values, 'slug')) {
        columns.slug =
          values.slug && String(values.slug).trim() !== ''
            ? values.slug
            : uniqueSlug(db, 'posts', values.title || existing.title, existing.id)
      }
      if ((values.status || existing.status) === 'published' && !existing.published_at) {
        columns.published_at = isoNow()
      }
      updateRow('posts', existing.id, columns)

      syncPostTags(existing.id, Object.prototype.hasOwnProperty.call(req.body, 'tags') ? req.body.tags : [])

      if (cover) {
        clearMediaCollection(db, 'Post', existing.id, 'cover')
        await storeUpload(db, { model_type: 'Post', model_id: existing.id, collection_name: 'cover', file: cover })
      }

      cache.flush()
      res.ok(serializePost(db, findOrFail('posts', existing.id), req), 'Post updated.')
    })
  )

  router.delete(
    '/posts/:id',
    wrap((req, res) => {
      const existing = findOrFail('posts', req.params.id)
      for (const media of mediaRows(db, 'Post', existing.id)) deleteMediaRow(db, media)
      db.prepare('DELETE FROM post_tag WHERE post_id = ?').run(existing.id)
      db.prepare('DELETE FROM posts WHERE id = ?').run(existing.id)
      cache.flush()
      res.noContent('Deleted')
    })
  )

  /* -------------------------------------------------------------- messages */

  router.get(
    '/messages/stats',
    wrap((req, res) => {
      res.ok({
        total: db.prepare('SELECT COUNT(*) AS c FROM contact_messages').get().c,
        unread: db
          .prepare('SELECT COUNT(*) AS c FROM contact_messages WHERE read_at IS NULL')
          .get().c,
      })
    })
  )

  router.get(
    '/messages',
    wrap((req, res) => {
      const perPage = 20
      const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
      const unread = toBoolean(req.query.unread)
      const where = unread ? 'WHERE read_at IS NULL' : ''
      const total = db.prepare(`SELECT COUNT(*) AS c FROM contact_messages ${where}`).get().c
      const rows = db
        .prepare(`SELECT * FROM contact_messages ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
        .all(perPage, (page - 1) * perPage)
      res.ok(rows.map(serializeContactMessage), 'OK', {
        pagination: {
          current_page: page,
          last_page: Math.max(1, Math.ceil(total / perPage)),
          per_page: perPage,
          total,
        },
      })
    })
  )

  router.get(
    '/messages/:id',
    wrap((req, res) => {
      res.ok(serializeContactMessage(findOrFail('contact_messages', req.params.id)))
    })
  )

  router.post(
    '/messages/:id/read',
    wrap((req, res) => {
      const row = findOrFail('contact_messages', req.params.id)
      db.prepare('UPDATE contact_messages SET read_at = ?, updated_at = ? WHERE id = ?').run(
        row.read_at || isoNow(),
        isoNow(),
        row.id
      )
      res.ok(serializeContactMessage(findOrFail('contact_messages', row.id)), 'Marked as read.')
    })
  )

  router.delete(
    '/messages/:id',
    wrap((req, res) => {
      const row = findOrFail('contact_messages', req.params.id)
      db.prepare('DELETE FROM contact_messages WHERE id = ?').run(row.id)
      res.noContent('Deleted')
    })
  )

  /* -------------------------------------------------------------- feedback */

  router.get(
    '/feedback/stats',
    wrap((req, res) => {
      const avg = db.prepare('SELECT AVG(rating) AS avg FROM feedback').get().avg
      res.ok({
        total: db.prepare('SELECT COUNT(*) AS c FROM feedback').get().c,
        unread: db.prepare('SELECT COUNT(*) AS c FROM feedback WHERE read_at IS NULL').get().c,
        avg_rating: Math.round((Number(avg) || 0) * 10) / 10,
        categories: db
          .prepare(
            `SELECT category, COUNT(*) AS total FROM feedback
             WHERE category IS NOT NULL GROUP BY category ORDER BY total DESC LIMIT 8`
          )
          .all(),
      })
    })
  )

  router.get(
    '/feedback',
    wrap((req, res) => {
      const perPage = 20
      const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
      const clauses = []
      const params = []
      if (toBoolean(req.query.unread)) clauses.push('read_at IS NULL')
      if (req.query.category) {
        clauses.push('category = ?')
        params.push(req.query.category)
      }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
      const total = db.prepare(`SELECT COUNT(*) AS c FROM feedback ${where}`).get(...params).c
      const rows = db
        .prepare(`SELECT * FROM feedback ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
        .all(...params, perPage, (page - 1) * perPage)
      res.ok(rows.map(serializeFeedback), 'OK', {
        pagination: {
          current_page: page,
          last_page: Math.max(1, Math.ceil(total / perPage)),
          per_page: perPage,
          total,
        },
      })
    })
  )

  router.get(
    '/feedback/:id',
    wrap((req, res) => {
      res.ok(serializeFeedback(findOrFail('feedback', req.params.id)))
    })
  )

  router.post(
    '/feedback/:id/read',
    wrap((req, res) => {
      const row = findOrFail('feedback', req.params.id)
      db.prepare('UPDATE feedback SET read_at = ?, updated_at = ? WHERE id = ?').run(
        row.read_at || isoNow(),
        isoNow(),
        row.id
      )
      res.ok(serializeFeedback(findOrFail('feedback', row.id)), 'Marked as read.')
    })
  )

  router.delete(
    '/feedback/:id',
    wrap((req, res) => {
      const row = findOrFail('feedback', req.params.id)
      db.prepare('DELETE FROM feedback WHERE id = ?').run(row.id)
      res.noContent('Deleted')
    })
  )

  /* -------------------------------------------------------------- settings */

  router.get(
    '/settings',
    wrap((req, res) => {
      const grouped = {}
      for (const row of db.prepare('SELECT * FROM settings').all()) {
        const group = row.group || 'general'
        if (!grouped[group]) grouped[group] = []
        grouped[group].push({
          key: row.key,
          value: row.value,
          group,
          is_public: toBoolean(row.is_public),
        })
      }
      res.ok(grouped)
    })
  )

  router.put(
    '/settings',
    wrap((req, res) => {
      const { ok, errors, values } = validate(req.body, {
        settings: ['required', 'array'],
      })
      if (!ok) throw new ValidationError(errors)
      if (!Array.isArray(values.settings)) throw new ValidationError({ settings: ['The settings must be an array.'] })

      for (const item of values.settings) {
        if (!item || typeof item.key !== 'string' || item.key.trim() === '') {
          throw new ValidationError({ 'settings.0.key': ['The settings.0.key field is required.'] })
        }
        const rawValue = item.value === undefined || item.value === null ? '' : item.value
        const stored = typeof rawValue === 'object' ? JSON.stringify(rawValue) : String(rawValue)
        const group = item.group || 'general'
        const isPublic = toBoolean(item.is_public) ? 1 : 0
        const existing = db.prepare('SELECT id FROM settings WHERE key = ?').get(item.key)
        if (existing) {
          db.prepare('UPDATE settings SET value = ?, "group" = ?, is_public = ? WHERE id = ?').run(
            stored,
            group,
            isPublic,
            existing.id
          )
        } else {
          db.prepare('INSERT INTO settings (key, value, "group", is_public) VALUES (?, ?, ?, ?)').run(
            item.key,
            stored,
            group,
            isPublic
          )
        }
      }

      cache.flush()
      res.ok(null, 'Settings saved.')
    })
  )

  /* ----------------------------------------------------------------- media */

  router.get(
    '/media',
    wrap((req, res) => {
      const perPage = 24
      const page = Math.max(1, parseInt(req.query.page || '1', 10) || 1)
      const search = String(req.query.search || '').trim()
      let where = ''
      const params = []
      if (search !== '') {
        where = 'WHERE name LIKE ? OR file_name LIKE ?'
        params.push(`%${search}%`, `%${search}%`)
      }
      const total = db.prepare(`SELECT COUNT(*) AS c FROM media ${where}`).get(...params).c
      const rows = db
        .prepare(`SELECT * FROM media ${where} ORDER BY id DESC LIMIT ? OFFSET ?`)
        .all(...params, perPage, (page - 1) * perPage)

      const items = rows.map((media) => ({
        id: media.id,
        name: media.name,
        file_name: media.file_name,
        mime_type: media.mime_type,
        size: media.size,
        collection_name: media.collection_name,
        model_type: media.model_type,
        url: mediaUrl(media, req),
        thumb: require('../lib/format').jsonParse(media.generated_conversions, {}).thumb
          ? mediaVariantUrl(media, req, 'thumb')
          : mediaUrl(media, req),
        created_at: toIso(sqliteToIso(media.created_at)),
      }))

      res.ok(items, 'OK', {
        pagination: {
          current_page: page,
          last_page: Math.max(1, Math.ceil(total / perPage)),
          per_page: perPage,
          total,
        },
      })
    })
  )

  router.post(
    '/media',
    wrap(async (req, res) => {
      const file = (req.uploads && req.uploads.media && req.uploads.media[0]) || null
      if (!file) {
        throw new ValidationError({ media: ['The media field is required.'] })
      }
      if (file.size === 0) {
        return res.error('Upload failed.', 422)
      }

      db.prepare('INSERT OR IGNORE INTO media_libraries (id) VALUES (1)').run()
      const media = await storeUpload(db, {
        model_type: 'MediaLibrary',
        model_id: 1,
        collection_name: 'library',
        file,
      })

      cache.flush()
      res.created(
        {
          id: media.id,
          name: media.name,
          file_name: media.file_name,
          mime_type: media.mime_type,
          size: media.size,
          url: mediaUrl(media, req),
        },
        'Media uploaded.'
      )
    })
  )

  router.delete(
    '/media/:id',
    wrap((req, res) => {
      const media = findOrFail('media', req.params.id)
      deleteMediaRow(db, media)
      cache.flush()
      res.noContent('Deleted')
    })
  )

  return router
}
