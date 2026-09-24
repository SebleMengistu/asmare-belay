import http from './http'

/**
 * Declarative admin resource registry.
 * Each entry drives the generic CrudTable: endpoint, display columns,
 * form fields and how rows are titled.
 *
 * Field types: text | textarea | number | boolean | date | tags
 */
export const RESOURCES = {
  skills: {
    title: 'Skills',
    singular: 'Skill',
    primary: 'name',
    columns: ['name', 'category', 'level', 'display_order', 'is_active'],
    countsBy: { field: 'category', label: 'Category' },
    formats: {
      category: {
        modeling: 'Hydrological Modeling',
        gis: 'GIS & Remote Sensing',
        programming: 'Programming',
        research: 'Research & Analysis',
        tools: 'Tools & Platforms',
        teaching: 'Teaching',
        frontend: 'Frontend',
        backend: 'Backend',
        database: 'Database',
        general: 'General',
      },
    },
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'modeling', label: 'Hydrological / Hydraulic / Groundwater Modeling' },
          { value: 'irrigation', label: 'Irrigation & Water Engineering' },
          { value: 'gis', label: 'Geospatial, GIS & Remote Sensing' },
          { value: 'programming', label: 'Programming & Data Analysis' },
          { value: 'research', label: 'Climate & Research Analysis' },
          { value: 'tools', label: 'Tools & Platforms' },
          { value: 'teaching', label: 'Teaching & Capacity Building' },
          { value: 'frontend', label: 'Frontend' },
          { value: 'backend', label: 'Backend' },
          { value: 'database', label: 'Database' },
          { value: 'general', label: 'General' },
        ],
      },
      { key: 'level', label: 'Level (0-100)', type: 'number' },
      { key: 'icon', label: 'Icon class', type: 'text' },
      { key: 'color', label: 'Color', type: 'text' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  experiences: {
    title: 'Experience',
    singular: 'Experience',
    primary: 'title',
    columns: ['title', 'company', 'start_date', 'current', 'is_active'],
    fields: [
      { key: 'title', label: 'Job title', type: 'text', required: true },
      { key: 'company', label: 'Company', type: 'text', required: true },
      { key: 'company_url', label: 'Company URL', type: 'text', placeholder: 'https://example.com' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'start_date', label: 'Start date', type: 'date', required: true },
      { key: 'end_date', label: 'End date', type: 'date' },
      { key: 'current', label: 'Current position', type: 'boolean', default: false },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'highlights', label: 'Highlights (one per line)', type: 'tags' },
      { key: 'display_order', label: 'Display order', type: 'number', default: 0 },
      { key: 'is_active', label: 'Active', type: 'boolean', default: true },
    ],
  },

  educations: {
    title: 'Education',
    singular: 'Education',
    primary: 'degree',
    columns: ['degree', 'institution', 'start_date', 'end_date', 'is_active'],
    fields: [
      { key: 'degree', label: 'Degree', type: 'text', required: true },
      { key: 'field_of_study', label: 'Field of study', type: 'text' },
      { key: 'institution', label: 'Institution', type: 'text', required: true },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'start_date', label: 'Start date', type: 'date' },
      { key: 'end_date', label: 'End date', type: 'date' },
      { key: 'grade', label: 'Grade / GPA', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  certifications: {
    title: 'Certifications',
    singular: 'Certification',
    primary: 'name',
    columns: ['name', 'issuer', 'issued_date', 'expiry_date', 'is_active'],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'issuer', label: 'Issuer', type: 'text', required: true },
      { key: 'image', label: 'Image (badge / logo)', type: 'image', accept: 'image/*' },
      { key: 'credential_url', label: 'Credential URL', type: 'text', placeholder: 'https://example.com/certificate' },
      { key: 'credential_id', label: 'Credential ID', type: 'text' },
      { key: 'issued_date', label: 'Issued date', type: 'date' },
      { key: 'expiry_date', label: 'Expiry date', type: 'date' },
      { key: 'skills', label: 'Skills covered (one per line)', type: 'tags' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  publications: {
    title: 'Publications',
    singular: 'Publication',
    primary: 'title',
    columns: ['title', 'venue', 'type', 'year', 'is_active'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'authors', label: 'Authors', type: 'text' },
      { key: 'venue', label: 'Venue / Journal', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'year', label: 'Year', type: 'text' },
      { key: 'url', label: 'URL', type: 'text', placeholder: 'https://doi.org/10.XXXX/example' },
      { key: 'doi', label: 'DOI', type: 'text' },
      { key: 'abstract', label: 'Abstract', type: 'textarea' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  services: {
    title: 'Services',
    singular: 'Service',
    primary: 'title',
    columns: ['title', 'price_from', 'currency', 'display_order', 'is_active'],
    fields: [
      { key: 'title', label: 'Title', type: 'text', required: true },
      { key: 'summary', label: 'Summary', type: 'textarea' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'icon', label: 'Icon class', type: 'text' },
      { key: 'price_from', label: 'Price from', type: 'number' },
      { key: 'currency', label: 'Currency', type: 'text' },
      { key: 'delivery', label: 'Delivery time', type: 'text' },
      { key: 'features', label: 'Features (one per line)', type: 'tags' },
      { key: 'cta_label', label: 'CTA label', type: 'text' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  testimonials: {
    title: 'Testimonials',
    singular: 'Testimonial',
    primary: 'name',
    columns: ['name', 'role', 'company', 'rating', 'is_active'],
    fields: [
      { key: 'name', label: 'Person name', type: 'text', required: true },
      { key: 'role', label: 'Role', type: 'text' },
      { key: 'company', label: 'Company', type: 'text' },
      { key: 'quote', label: 'Quote', type: 'textarea', required: true },
      { key: 'rating', label: 'Rating (1-5)', type: 'number' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  achievements: {
    title: 'Achievements',
    singular: 'Achievement',
    primary: 'title',
    columns: ['title', 'organization', 'achieved_at', 'category', 'is_active'],
    fields: [
      { key: 'title', label: 'Achievement title', type: 'text', required: true },
      { key: 'organization', label: 'Organization', type: 'text' },
      { key: 'achieved_at', label: 'Date', type: 'date' },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'Professional', label: 'Professional' },
          { value: 'Academic', label: 'Academic' },
          { value: 'Competition', label: 'Competition' },
          { value: 'Leadership', label: 'Leadership' },
          { value: 'Community', label: 'Community' },
          { value: 'Technical', label: 'Technical' },
        ],
      },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'image', label: 'Certificate / image URL', type: 'text' },
      { key: 'url', label: 'External URL', type: 'text', placeholder: 'https://example.com' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  languages: {
    title: 'Languages',
    singular: 'Language',
    primary: 'name',
    columns: ['name', 'proficiency', 'display_order', 'is_active'],
    fields: [
      { key: 'name', label: 'Language', type: 'text', required: true },
      { key: 'proficiency', label: 'Proficiency', type: 'text', placeholder: 'Mother Tongue / C2 / Fluent…' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  conferences: {
    title: 'Conferences & Seminars',
    singular: 'Conference',
    primary: 'name',
    columns: ['name', 'event_date', 'location', 'role', 'is_active'],
    fields: [
      { key: 'name', label: 'Event name', type: 'text', required: true },
      { key: 'event_date', label: 'Date', type: 'date' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'role', label: 'Your role', type: 'text', placeholder: 'Presenter / Attendee / Organizer…' },
      { key: 'topic', label: 'Topic', type: 'text' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'url', label: 'Event URL', type: 'text' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },

  research: {
    title: 'Research Themes',
    singular: 'Research theme',
    primary: 'topic',
    columns: ['topic', 'display_order', 'is_active'],
    fields: [
      { key: 'topic', label: 'Research topic', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'methods', label: 'Methods / tools (one per line)', type: 'tags' },
      { key: 'url', label: 'Related link', type: 'text' },
      { key: 'display_order', label: 'Display order', type: 'number' },
      { key: 'is_active', label: 'Active', type: 'boolean' },
    ],
  },
}

/** Fetch a resource list. Returns array of plain row objects. */
export async function listResource(key, params = {}) {
  const res = await http.get(`/admin/${key}`, { params })
  return res.data ?? []
}

/** Create a record with the given JSON payload. */
export async function createResource(key, payload) {
  const res = await http.post(`/admin/${key}`, payload)
  return res.data
}

/** Update a record by id with the given JSON payload. */
export async function updateResource(key, id, payload) {
  const res = await http.put(`/admin/${key}/${id}`, payload)
  return res.data
}

/** Delete a record by id. */
export async function deleteResource(key, id) {
  await http.delete(`/admin/${key}/${id}`)
}
