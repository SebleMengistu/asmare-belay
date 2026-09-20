'use strict'

/**
 * Postgres/Supabase DDL mirroring the original SQLite schema. Types were
 * chosen so that values round-trip identically through the existing
 * serializers:
 *   - timestamps -> TIMESTAMPTZ (ISO strings in, converted back to ISO out)
 *   - dates      -> TEXT          (kept verbatim as YYYY-MM-DD, avoids tz shifts)
 *   - JSON       -> JSONB         (parsed by node-postgres, unchanged by JSON.parse)
 *   - 0/1 flags  -> BOOLEAN
 */

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified_at TIMESTAMPTZ,
  password TEXT NOT NULL,
  remember_token TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  guard_name TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE (name, guard_name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  guard_name TEXT NOT NULL,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE (name, guard_name)
);

CREATE TABLE IF NOT EXISTS model_has_roles (
  role_id INTEGER NOT NULL,
  model_type TEXT NOT NULL,
  model_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, model_type, model_id)
);

CREATE TABLE IF NOT EXISTS model_has_permissions (
  permission_id INTEGER NOT NULL,
  model_type TEXT NOT NULL,
  model_id INTEGER NOT NULL,
  PRIMARY KEY (permission_id, model_type, model_id)
);

CREATE TABLE IF NOT EXISTS role_has_permissions (
  permission_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  PRIMARY KEY (permission_id, role_id)
);

CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  headline TEXT,
  tagline TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  email_public TEXT,
  phone TEXT,
  github TEXT,
  linkedin TEXT,
  twitter TEXT,
  whatsapp TEXT,
  roles JSONB,
  available_for_work BOOLEAN NOT NULL DEFAULT TRUE,
  meta JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS skills (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  level INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS experiences (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_url TEXT,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  current BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  highlights JSONB,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS educations (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  degree TEXT NOT NULL,
  field_of_study TEXT,
  institution TEXT NOT NULL,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  grade TEXT,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS certifications (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  credential_url TEXT,
  credential_id TEXT,
  issued_date TEXT,
  expiry_date TEXT,
  skills JSONB,
  image TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  category TEXT,
  repo_url TEXT,
  demo_url TEXT,
  tech_stack JSONB,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  start_date TEXT,
  end_date TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS project_skill (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  UNIQUE (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS publications (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  authors TEXT,
  venue TEXT,
  type TEXT NOT NULL DEFAULT 'journal',
  year TEXT,
  url TEXT,
  doi TEXT,
  abstract TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  icon TEXT,
  price_from DOUBLE PRECISION,
  currency TEXT NOT NULL DEFAULT 'USD',
  delivery TEXT,
  features JSONB,
  cta_label TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS testimonials (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS post_tags (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS post_tag (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  post_tag_id INTEGER NOT NULL,
  UNIQUE (post_id, post_tag_id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip TEXT,
  device TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  "group" TEXT NOT NULL DEFAULT 'general',
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  meta JSONB,
  occurred_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT,
  category TEXT,
  rating INTEGER,
  message TEXT NOT NULL,
  ip TEXT,
  device TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS media (
  id SERIAL PRIMARY KEY,
  model_type TEXT NOT NULL,
  model_id INTEGER NOT NULL,
  uuid TEXT,
  collection_name TEXT NOT NULL,
  name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  mime_type TEXT,
  disk TEXT NOT NULL DEFAULT 'public',
  conversions_disk TEXT,
  size INTEGER NOT NULL DEFAULT 0,
  manipulations JSONB,
  custom_properties JSONB,
  generated_conversions JSONB,
  responsive_images JSONB,
  order_column INTEGER,
  file_data BYTEA,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS media_libraries (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id SERIAL PRIMARY KEY,
  tokenable_type TEXT NOT NULL,
  tokenable_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  abilities JSONB,
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS skills_category_active_idx ON skills (category, is_active);
CREATE INDEX IF NOT EXISTS analytics_event_idx ON analytics_events (event);
CREATE INDEX IF NOT EXISTS analytics_occurred_idx ON analytics_events (occurred_at);
`

module.exports = { SCHEMA }
