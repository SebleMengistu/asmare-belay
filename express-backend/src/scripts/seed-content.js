'use strict'

/**
 * One-time content seeding for Asmare Belay's portfolio.
 *
 *   DATABASE_URL=postgresql://... node src/scripts/seed-content.js
 *
 * Applies the schema (idempotent), seeds roles/admin when the database is
 * empty, then fills the profile, skills, experiences, educations,
 * certifications, publications, projects and posts from the real CV data in
 * src/lib/cvData.js. Safe to re-run: profile is updated in place and content
 * rows are only inserted when their table is still empty.
 */

const config = require('../config')
const { db, pool } = require('../lib/db')
const { SCHEMA } = require('../lib/schema')
const { seedIfEmpty } = require('../lib/seed')
const { PROFILE, SKILLS, EXPERIENCES, EDUCATIONS, CERTIFICATIONS, PUBLICATIONS, PROJECTS, POSTS } = require('../lib/cvData')

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}

async function count(table) {
  const { rows } = await pool.query(`SELECT COUNT(*)::int AS n FROM ${table}`)
  return rows[0].n
}

async function upsertProfile() {
  const now = new Date().toISOString()
  const { rows } = await pool.query(
    `SELECT id FROM profiles ORDER BY id LIMIT 1`,
  )
  const values = [
    PROFILE.first_name,
    PROFILE.last_name,
    PROFILE.display_name,
    PROFILE.headline,
    PROFILE.tagline,
    PROFILE.bio,
    PROFILE.location,
    PROFILE.website,
    PROFILE.email_public,
    PROFILE.phone,
    PROFILE.github,
    PROFILE.linkedin,
    PROFILE.twitter,
    PROFILE.whatsapp,
    JSON.stringify(PROFILE.roles),
    JSON.stringify(PROFILE.meta),
    now,
  ]

  if (rows.length) {
    await pool.query(
      `UPDATE profiles SET
         first_name = $1, last_name = $2, display_name = $3, headline = $4,
         tagline = $5, bio = $6, location = $7, website = $8,
         email_public = $9, phone = $10, github = $11, linkedin = $12,
         twitter = $13, whatsapp = $14, roles = $15, meta = $16,
         available_for_work = TRUE, updated_at = $17
       WHERE id = $18`,
      [...values, rows[0].id],
    )
    console.log(`profile: updated row #${rows[0].id}`)
    return rows[0].id
  }

  const admin = await pool.query(`SELECT id FROM users ORDER BY id LIMIT 1`)
  const inserted = await pool.query(
    `INSERT INTO profiles
       (user_id, first_name, last_name, display_name, headline, tagline, bio,
        location, website, email_public, phone, github, linkedin, twitter,
        whatsapp, roles, available_for_work, meta, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, TRUE, $17, $18, $18)
     RETURNING id`,
    [admin.rows[0]?.id ?? null, ...values],
  )
  console.log(`profile: created row #${inserted.rows[0].id}`)
  return inserted.rows[0].id
}

async function seedSkills(profileId) {
  if ((await count('skills')) > 0) return console.log('skills: already populated, skipping')
  for (const [i, [name, category, level]] of SKILLS.entries()) {
    await db.run(
      `INSERT INTO skills (profile_id, name, category, level, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      profileId, name, category, level, i + 1,
    )
  }
  console.log(`skills: inserted ${SKILLS.length}`)
}

async function seedExperiences(profileId) {
  if ((await count('experiences')) > 0) return console.log('experiences: already populated, skipping')
  for (const e of EXPERIENCES) {
    await db.run(
      `INSERT INTO experiences
         (profile_id, title, company, company_url, location, start_date, end_date,
          current, description, highlights, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      profileId, e.title, e.company, e.company_url, e.location, e.start_date,
      e.end_date, e.current, e.description, JSON.stringify(e.highlights), e.display_order,
    )
  }
  console.log(`experiences: inserted ${EXPERIENCES.length}`)
}

async function seedEducations(profileId) {
  if ((await count('educations')) > 0) return console.log('educations: already populated, skipping')
  for (const e of EDUCATIONS) {
    await db.run(
      `INSERT INTO educations
         (profile_id, degree, field_of_study, institution, location, start_date,
          end_date, grade, description, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      profileId, e.degree, e.field_of_study, e.institution, e.location,
      e.start_date, e.end_date, e.grade, e.description, e.display_order,
    )
  }
  console.log(`educations: inserted ${EDUCATIONS.length}`)
}

async function seedCertifications(profileId) {
  if ((await count('certifications')) > 0) return console.log('certifications: already populated, skipping')
  for (const [i, [name, issuer]] of CERTIFICATIONS.entries()) {
    await db.run(
      `INSERT INTO certifications (profile_id, name, issuer, display_order, is_active)
       VALUES (?, ?, ?, ?, TRUE)`,
      profileId, name, issuer, i + 1,
    )
  }
  console.log(`certifications: inserted ${CERTIFICATIONS.length}`)
}

async function seedPublications(profileId) {
  if ((await count('publications')) > 0) return console.log('publications: already populated, skipping')
  for (const p of PUBLICATIONS) {
    await db.run(
      `INSERT INTO publications
         (profile_id, title, slug, authors, venue, type, year, url, abstract, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      profileId, p.title, slugify(p.title), p.authors, p.venue, p.type,
      p.year, p.url, p.abstract, p.display_order,
    )
  }
  console.log(`publications: inserted ${PUBLICATIONS.length}`)
}

async function seedProjects(profileId) {
  if ((await count('projects')) > 0) return console.log('projects: already populated, skipping')
  for (const p of PROJECTS) {
    await db.run(
      `INSERT INTO projects
         (profile_id, title, slug, summary, description, category, repo_url,
          demo_url, tech_stack, featured, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      profileId, p.title, p.slug, p.summary, p.description, p.category,
      p.repo_url, p.demo_url, JSON.stringify(p.tech_stack), p.featured, p.display_order,
    )
  }
  console.log(`projects: inserted ${PROJECTS.length}`)
}

async function seedPosts(profileId) {
  if ((await count('posts')) > 0) return console.log('posts: already populated, skipping')
  for (const p of POSTS) {
    const post = await db.run(
      `INSERT INTO posts
         (profile_id, title, slug, excerpt, body, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'published', ?, NOW(), NOW())
       RETURNING id`,
      profileId, p.title, p.slug, p.excerpt, p.body, p.published_at,
    )
    for (const tagName of p.tags) {
      const tagSlug = slugify(tagName)
      const tag = await db.run(
        `INSERT INTO post_tags (name, slug, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        tagName, tagSlug,
      )
      await db.run(
        `INSERT INTO post_tag (post_id, post_tag_id) VALUES (?, ?)
         ON CONFLICT DO NOTHING`,
        post.id, tag.id,
      )
    }
  }
  console.log(`posts: inserted ${POSTS.length}`)
}

async function main() {
  await pool.query(SCHEMA)
  console.log('schema: applied')

  const seeded = await seedIfEmpty()
  console.log(seeded.seeded ? 'seed: admin + roles created' : 'seed: users already exist, skipping')

  const profileId = await upsertProfile()
  await seedSkills(profileId)
  await seedExperiences(profileId)
  await seedEducations(profileId)
  await seedCertifications(profileId)
  await seedPublications(profileId)
  await seedProjects(profileId)
  await seedPosts(profileId)

  console.log('Done.')
}

main()
  .catch((err) => {
    console.error('seed-content failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => pool.end())
