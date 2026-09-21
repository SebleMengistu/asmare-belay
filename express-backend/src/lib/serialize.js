'use strict'

const { jsonParse, toIso, toDateString, sqliteToIso, toBoolean } = require('./format')
const { firstMedia, mediaRows, mediaUrl, mediaVariantUrl } = require('./media')

const isoOut = (value) => toIso(sqliteToIso(value))
const dateOut = (value) => toDateString(value)
const bool = (value) => Boolean(Number(value))
const list = (value) => jsonParse(value, null)

function serializeSkill(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    level: row.level,
    icon: row.icon,
    color: row.color,
    display_order: row.display_order,
    is_active: bool(row.is_active),
  }
}

function serializeExperience(row) {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    company_url: row.company_url,
    location: row.location,
    start_date: dateOut(row.start_date),
    end_date: dateOut(row.end_date),
    current: Boolean(Number(row.current)),
    description: row.description,
    highlights: list(row.highlights),
    display_order: row.display_order,
    is_active: bool(row.is_active),
  }
}

function serializeEducation(row) {
  return {
    id: row.id,
    degree: row.degree,
    field_of_study: row.field_of_study,
    institution: row.institution,
    location: row.location,
    start_date: dateOut(row.start_date),
    end_date: dateOut(row.end_date),
    grade: row.grade,
    description: row.description,
    display_order: row.display_order,
    is_active: bool(row.is_active),
  }
}

function serializeCertification(row) {
  return {
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    credential_url: row.credential_url,
    credential_id: row.credential_id,
    issued_date: dateOut(row.issued_date),
    expiry_date: dateOut(row.expiry_date),
    skills: list(row.skills),
    image: row.image,
    display_order: row.display_order,
    is_active: bool(row.is_active),
  }
}

function serializePublication(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    authors: row.authors,
    venue: row.venue,
    type: row.type,
    year: row.year,
    url: row.url,
    doi: row.doi,
    abstract: row.abstract,
    display_order: row.display_order,
    is_active: bool(row.is_active),
  }
}

function serializeService(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    icon: row.icon,
    price_from: row.price_from,
    currency: row.currency,
    delivery: row.delivery,
    features: list(row.features),
    cta_label: row.cta_label,
    display_order: row.display_order,
    is_active: bool(row.is_active),
  }
}

function serializeTestimonial(row) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    company: row.company,
    quote: row.quote,
    rating: row.rating,
    display_order: row.display_order,
    is_active: bool(row.is_active),
  }
}

function serializeTag(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    created_at: isoOut(row.created_at),
    updated_at: isoOut(row.updated_at),
  }
}

async function tagsForPost(db, postId) {
  return db.all(
    `SELECT t.* FROM post_tag pt JOIN post_tags t ON t.id = pt.post_tag_id
     WHERE pt.post_id = ? ORDER BY t.id`,
    postId
  )
}

async function serializePost(db, row, req) {
  const cover = await firstMedia(db, 'Post', row.id, 'cover')
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    body: row.body,
    status: row.status,
    published_at: isoOut(row.published_at),
    tags: (await tagsForPost(db, row.id)).map(serializeTag),
    cover: mediaVariantUrl(cover, req, 'card'),
    meta_title: row.meta_title,
    meta_description: row.meta_description,
  }
}

async function skillsForProject(db, projectId) {
  const rows = await db.all(
    `SELECT s.* FROM project_skill ps JOIN skills s ON s.id = ps.skill_id
     WHERE ps.project_id = ? ORDER BY s.id`,
    projectId
  )
  return rows.map(serializeSkill)
}

async function serializeProject(db, row, req) {
  const media = await mediaRows(db, 'Project', row.id, 'screenshots')
  const screenshots = media.map((item) => ({
      id: item.id,
      url: mediaUrl(item, req),
      thumb: mediaVariantUrl(item, req, 'thumb'),
      card: mediaVariantUrl(item, req, 'card'),
      hero: mediaVariantUrl(item, req, 'hero'),
    }))

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    description: row.description,
    category: row.category,
    repo_url: row.repo_url,
    demo_url: row.demo_url,
    tech_stack: list(row.tech_stack),
    featured: bool(row.featured),
    display_order: row.display_order,
    is_active: bool(row.is_active),
    start_date: dateOut(row.start_date),
    end_date: dateOut(row.end_date),
    skills: await skillsForProject(db, row.id),
    screenshots,
  }
}

async function serializeProfile(db, row, req) {
  const avatar = await firstMedia(db, 'Profile', row.id, 'avatar')
  const cover = await firstMedia(db, 'Profile', row.id, 'cover')
  const resume = await firstMedia(db, 'Profile', row.id, 'resume')
  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    display_name: row.display_name,
    headline: row.headline,
    tagline: row.tagline,
    bio: row.bio,
    location: row.location,
    website: row.website,
    email_public: row.email_public,
    phone: row.phone,
    github: row.github,
    linkedin: row.linkedin,
    twitter: row.twitter,
    whatsapp: row.whatsapp,
    roles: list(row.roles),
    available_for_work: toBoolean(row.available_for_work),
    meta: list(row.meta),
    avatar: mediaUrl(avatar, req),
    cover: mediaVariantUrl(cover, req, 'hero'),
    resume: mediaUrl(resume, req),
  }
}

function serializeContactMessage(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    subject: row.subject,
    message: row.message,
    ip: row.ip,
    device: row.device,
    read_at: isoOut(row.read_at),
    created_at: isoOut(row.created_at),
  }
}

function serializeFeedback(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    category: row.category,
    rating: row.rating,
    message: row.message,
    ip: row.ip,
    device: row.device,
    read_at: isoOut(row.read_at),
    created_at: isoOut(row.created_at),
  }
}

module.exports = {
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
  skillsForProject,
  tagsForPost,
}
