'use strict'

const fs = require('fs')
const path = require('path')
const { DatabaseSync } = require('node:sqlite')
const config = require('../config')

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified_at TEXT,
  password TEXT NOT NULL,
  remember_token TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  guard_name TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  UNIQUE (name, guard_name)
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  guard_name TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
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
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  roles TEXT,
  available_for_work INTEGER NOT NULL DEFAULT 1,
  meta TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  level INTEGER NOT NULL DEFAULT 0,
  icon TEXT,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS experiences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_url TEXT,
  location TEXT,
  start_date TEXT,
  end_date TEXT,
  current INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  highlights TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS educations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS certifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  name TEXT NOT NULL,
  issuer TEXT NOT NULL,
  credential_url TEXT,
  credential_id TEXT,
  issued_date TEXT,
  expiry_date TEXT,
  skills TEXT,
  image TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  category TEXT,
  repo_url TEXT,
  demo_url TEXT,
  tech_stack TEXT,
  featured INTEGER NOT NULL DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS project_skill (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL,
  skill_id INTEGER NOT NULL,
  UNIQUE (project_id, skill_id)
);

CREATE TABLE IF NOT EXISTS publications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  summary TEXT,
  description TEXT,
  icon TEXT,
  price_from REAL,
  currency TEXT NOT NULL DEFAULT 'USD',
  delivery TEXT,
  features TEXT,
  cta_label TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  name TEXT NOT NULL,
  role TEXT,
  company TEXT,
  quote TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  profile_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  body TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS post_tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS post_tag (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  post_tag_id INTEGER NOT NULL,
  UNIQUE (post_id, post_tag_id)
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  ip TEXT,
  device TEXT,
  read_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  "group" TEXT NOT NULL DEFAULT 'general',
  is_public INTEGER NOT NULL DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event TEXT NOT NULL,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  meta TEXT,
  occurred_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT,
  category TEXT,
  rating INTEGER,
  message TEXT NOT NULL,
  ip TEXT,
  device TEXT,
  read_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS media (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
  manipulations TEXT,
  custom_properties TEXT,
  generated_conversions TEXT,
  responsive_images TEXT,
  order_column INTEGER,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS media_libraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS personal_access_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tokenable_type TEXT NOT NULL,
  tokenable_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  abilities TEXT,
  last_used_at TEXT,
  expires_at TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS skills_category_active_idx ON skills (category, is_active);
CREATE INDEX IF NOT EXISTS analytics_event_idx ON analytics_events (event);
CREATE INDEX IF NOT EXISTS analytics_occurred_idx ON analytics_events (occurred_at);
`

let db = null

function open() {
  fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })
  db = new DatabaseSync(config.dbPath)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec(SCHEMA)
  return db
}

function getDb() {
  if (!db) open()
  return db
}

function lastInsertId(connection = db) {
  return Number(connection.prepare('SELECT last_insert_rowid() AS id').get().id)
}

module.exports = { getDb, open, lastInsertId, SCHEMA }
