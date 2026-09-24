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
const { db } = require('../lib/db')
const { SCHEMA } = require('../lib/schema')
const { seedIfEmpty } = require('../lib/seed')
const {
  PROFILE,
  SKILLS,
  EXPERIENCES,
  EDUCATIONS,
  CERTIFICATIONS,
  PUBLICATIONS,
  PROJECTS,
  POSTS,
  ACHIEVEMENTS,
  LANGUAGES,
  RESEARCH,
} = require('../lib/cvData')

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 180)
}

async function upsertProfile() {
  const existing = await db.get(`SELECT id FROM profiles ORDER BY id LIMIT 1`)

  if (existing) {
    await db.run(
      `UPDATE profiles SET
         first_name = ?, last_name = ?, display_name = ?, headline = ?,
         tagline = ?, bio = ?, location = ?, website = ?,
         email_public = ?, phone = ?, github = ?, linkedin = ?,
         twitter = ?, whatsapp = ?, roles = ?, meta = ?,
         available_for_work = TRUE, updated_at = NOW()
       WHERE id = ?`,
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
      existing.id,
    )
    console.log(`profile: updated row #${existing.id}`)
    return existing.id
  }

  const admin = await db.get(`SELECT id FROM users ORDER BY id LIMIT 1`)
  const inserted = await db.run(
    `INSERT INTO profiles
       (user_id, first_name, last_name, display_name, headline, tagline, bio,
        location, website, email_public, phone, github, linkedin, twitter,
        whatsapp, roles, available_for_work, meta, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, NOW(), NOW())`,
    admin?.id ?? null,
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
  )
  console.log(`profile: created row #${inserted.id}`)
  return inserted.id
}

/**
 * Skills are replace-on-reseed: the seeded catalog is authoritative, and
 * user-created rows (ids beyond the seeded set) are preserved.
 */
async function seedSkills(profileId) {
  const seededNames = SKILLS.map(([name]) => name)
  const existing = await db.all('SELECT id, name FROM skills ORDER BY id')
  const byName = new Map(existing.map((row) => [row.name, row.id]))

  for (const [i, [name, category, level]] of SKILLS.entries()) {
    const id = byName.get(name)
    if (id) {
      await db.run('UPDATE skills SET category = ?, level = ?, display_order = ?, updated_at = NOW() WHERE id = ?', category, level, i + 1, id)
    } else {
      await db.run(
        `INSERT INTO skills (profile_id, name, category, level, display_order, is_active)
         VALUES (?, ?, ?, ?, ?, TRUE)`,
        profileId, name, category, level, i + 1,
      )
    }
  }
  console.log(`skills: ensured ${SKILLS.length} seeded rows (${existing.length} existed before)`)
}

async function seedExperiences(profileId) {
  if ((await db.count('experiences')) > 0) return console.log('experiences: already populated, skipping')
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
  if ((await db.count('educations')) > 0) return console.log('educations: already populated, skipping')
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
  const existing = await db.all('SELECT id, name FROM certifications ORDER BY id')
  const byName = new Map(existing.map((row) => [row.name, row.id]))
  for (const [i, [name, issuer, category]] of CERTIFICATIONS.entries()) {
    const id = byName.get(name)
    if (id) {
      await db.run('UPDATE certifications SET issuer = ?, category = ?, display_order = ?, updated_at = NOW() WHERE id = ?', issuer, category ?? null, i + 1, id)
    } else {
      await db.run(
        'INSERT INTO certifications (profile_id, name, issuer, category, display_order, is_active) VALUES (?, ?, ?, ?, ?, TRUE)',
        profileId, name, issuer, category ?? null, i + 1,
      )
    }
  }
  console.log(`certifications: ensured ${CERTIFICATIONS.length} seeded rows`)
}

async function seedPublications(profileId) {
  if ((await db.count('publications')) > 0) return console.log('publications: already populated, skipping')
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
  for (const p of PROJECTS) {
    const existing = await db.get('SELECT id FROM projects WHERE slug = ?', p.slug)
    if (existing) {
      await db.run(
        `UPDATE projects SET
           title = ?, summary = ?, description = ?, category = ?,
           role = ?, organization = ?, status = ?,
           repo_url = ?, demo_url = ?, tech_stack = ?,
           featured = ?, display_order = ?, updated_at = NOW()
         WHERE id = ?`,
        p.title, p.summary, p.description, p.category,
        p.role ?? null, p.organization ?? null, p.status ?? null,
        p.repo_url ?? null, p.demo_url ?? null, JSON.stringify(p.tech_stack ?? []),
        p.featured ?? false, p.display_order ?? 0, existing.id,
      )
    } else {
      await db.run(
        `INSERT INTO projects
           (profile_id, title, slug, summary, description, category, role,
            organization, status, repo_url, demo_url, tech_stack, featured,
            display_order, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        profileId, p.title, p.slug, p.summary, p.description, p.category,
        p.role ?? null, p.organization ?? null, p.status ?? null,
        p.repo_url ?? null, p.demo_url ?? null, JSON.stringify(p.tech_stack ?? []),
        p.featured ?? false, p.display_order ?? 0,
      )
    }
  }
  console.log(`projects: ensured ${PROJECTS.length} seeded rows`)
}

async function seedAchievements(profileId) {
  if ((await db.count('achievements')) > 0) return console.log('achievements: already populated, skipping')
  for (const a of ACHIEVEMENTS) {
    await db.run(
      `INSERT INTO achievements
         (profile_id, title, organization, achieved_at, description, category, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      profileId, a.title, a.organization, a.achieved_at, a.description, a.category, a.display_order,
    )
  }
  console.log(`achievements: inserted ${ACHIEVEMENTS.length}`)
}

async function seedLanguages(profileId) {
  if ((await db.count('languages')) > 0) return console.log('languages: already populated, skipping')
  for (const l of LANGUAGES) {
    await db.run(
      'INSERT INTO languages (profile_id, name, proficiency, display_order, is_active) VALUES (?, ?, ?, ?, TRUE)',
      profileId, l.name, l.proficiency, l.display_order,
    )
  }
  console.log(`languages: inserted ${LANGUAGES.length}`)
}

async function seedResearch(profileId) {
  if ((await db.count('research')) > 0) return console.log('research: already populated, skipping')
  for (const r of RESEARCH) {
    await db.run(
      'INSERT INTO research (profile_id, topic, description, methods, url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
      profileId, r.topic, r.description, JSON.stringify(r.methods ?? []), r.url ?? null, r.display_order,
    )
  }
  console.log(`research: inserted ${RESEARCH.length}`)
}

async function seedPosts(profileId) {
  if ((await db.count('posts')) > 0) return console.log('posts: already populated, skipping')
  for (const p of POSTS) {
    const post = await db.run(
      `INSERT INTO posts
         (profile_id, title, slug, excerpt, body, status, published_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'published', ?, NOW(), NOW())`,
      profileId, p.title, p.slug, p.excerpt, p.body, p.published_at,
    )
    for (const tagName of p.tags) {
      const tag = await db.run(
        `INSERT INTO post_tags (name, slug, created_at, updated_at)
         VALUES (?, ?, NOW(), NOW())
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name`,
        tagName, slugify(tagName),
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

async function seedAchievements(profileId) {
  if ((await db.count('achievements')) > 0) return console.log('achievements: already populated, skipping')
  for (const a of ACHIEVEMENTS) {
    await db.run(
      `INSERT INTO achievements
         (profile_id, title, organization, achieved_at, description, category, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      profileId, a.title, a.organization, a.achieved_at, a.description, a.category, a.display_order,
    )
  }
  console.log(`achievements: inserted ${ACHIEVEMENTS.length}`)
}

async function seedLanguages(profileId) {
  if ((await db.count('languages')) > 0) return console.log('languages: already populated, skipping')
  for (const l of LANGUAGES) {
    await db.run(
      'INSERT INTO languages (profile_id, name, proficiency, display_order, is_active) VALUES (?, ?, ?, ?, TRUE)',
      profileId, l.name, l.proficiency, l.display_order,
    )
  }
  console.log(`languages: inserted ${LANGUAGES.length}`)
}

async function seedResearch(profileId) {
  if ((await db.count('research')) > 0) return console.log('research: already populated, skipping')
  for (const r of RESEARCH) {
    await db.run(
      'INSERT INTO research (profile_id, topic, description, methods, url, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
      profileId, r.topic, r.description, JSON.stringify(r.methods ?? []), r.url ?? null, r.display_order,
    )
  }
  console.log(`research: inserted ${RESEARCH.length}`)
}

async function main() {
  await db.exec(SCHEMA)
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
  await seedAchievements(profileId)
  await seedLanguages(profileId)
  await seedResearch(profileId)

  console.log('Done.')
}

main()
  .catch((err) => {
    console.error('seed-content failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => db.close())
