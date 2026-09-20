'use strict'

const { toBoolean, toInt, toFloat, isPlainObject } = require('./format')

/**
 * Compact Laravel-style validator. Produces the same 422 `errors` payload:
 *   { field: ["The field must be ..."] }
 * and a `values` object containing only the keys that were present + valid
 * (mirrors `$request->validated()`).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i

function humanize(field) {
  return String(field).replace(/[._]/g, ' ')
}

function parseRule(rule) {
  const idx = rule.indexOf(':')
  if (idx === -1) return { name: rule, param: null }
  return { name: rule.slice(0, idx), param: rule.slice(idx + 1) }
}

function sizeOf(value) {
  if (Array.isArray(value)) return value.length
  if (typeof value === 'number') return value
  return String(value ?? '').length
}

function isNumericField(specs) {
  return specs.some((spec) => spec === 'integer' || spec === 'numeric' || spec === 'decimal')
}

function dateOf(value) {
  if (value === null || value === undefined || value === '') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function createValidator(db) {
  return async function validate(data, rules) {
    const errors = {}
    const values = {}
    const source = isPlainObject(data) ? data : {}

    for (const [field, specs] of Object.entries(rules)) {
      const attr = humanize(field)
      const present = Object.prototype.hasOwnProperty.call(source, field)
      const nullable = specs.includes('nullable')
      const sometimes = specs.includes('sometimes')
      const required = specs.includes('required')
      const fieldErrors = []
      let value = source[field]

      if (!present) {
        if (required) {
          fieldErrors.push(`The ${attr} field is required.`)
        } else if (sometimes || nullable) {
          continue
        } else {
          continue
        }
        errors[field] = fieldErrors
        continue
      }

      if (nullable && (value === null || value === '')) {
        values[field] = null
        continue
      }

      if (required) {
        const empty =
          value === null ||
          value === undefined ||
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)
        if (empty) {
          errors[field] = [`The ${attr} field is required.`]
          continue
        }
      }

      for (const rawRule of specs) {
        const { name, param } = parseRule(rawRule)

        switch (name) {
          case 'nullable':
          case 'sometimes':
          case 'required':
          case 'bail':
            break

          case 'string':
            if (typeof value !== 'string') {
              fieldErrors.push(`The ${attr} must be a string.`)
            }
            break

          case 'integer': {
            const n = toInt(value)
            if (n === null || String(value).trim() === '') {
              fieldErrors.push(`The ${attr} must be an integer.`)
            } else {
              value = n
            }
            break
          }

          case 'numeric':
          case 'decimal': {
            const n = toFloat(value)
            if (n === null) {
              fieldErrors.push(`The ${attr} must be a number.`)
            } else {
              value = n
            }
            break
          }

          case 'boolean': {
            const b = toBoolean(value)
            if (b === null) {
              fieldErrors.push(`The ${attr} field must be true or false.`)
            } else {
              value = b
            }
            break
          }

          case 'array':
            // Laravel semantics: an associative array (`meta[key]=value`
            // multipart fields parse to a plain object) is a valid "array".
            if (!Array.isArray(value) && !isPlainObject(value)) {
              fieldErrors.push(`The ${attr} must be an array.`)
            }
            break

          case 'email':
            if (typeof value !== 'string' || !EMAIL_RE.test(value)) {
              fieldErrors.push(`The ${attr} must be a valid email address.`)
            }
            break

          case 'url':
            if (typeof value !== 'string' || !URL_RE.test(value)) {
              fieldErrors.push(`The ${attr} must be a valid URL.`)
            }
            break

          case 'date':
            if (dateOf(value) === null) {
              fieldErrors.push(`The ${attr} must be a valid date.`)
            }
            break

          case 'in': {
            const allowed = String(param).split(',')
            if (!allowed.includes(String(value))) {
              fieldErrors.push(`The selected ${attr} is invalid.`)
            }
            break
          }

          case 'max': {
            if (isNumericField(specs)) {
              if (Number(value) > Number(param)) {
                fieldErrors.push(`The ${attr} must not be greater than ${param}.`)
              }
            } else if (sizeOf(value) > Number(param)) {
              const suffix = Array.isArray(value) ? '' : ' characters'
              fieldErrors.push(`The ${attr} must not be greater than ${param}${suffix}.`)
            }
            break
          }

          case 'min': {
            if (isNumericField(specs)) {
              if (Number(value) < Number(param)) {
                fieldErrors.push(`The ${attr} must be at least ${param}.`)
              }
            } else if (sizeOf(value) < Number(param)) {
              const suffix = Array.isArray(value) ? '' : ' characters'
              fieldErrors.push(`The ${attr} must be at least ${param}${suffix}.`)
            }
            break
          }

          case 'after_or_equal':
          case 'after': {
            const other = dateOf(source[param])
            const current = dateOf(value)
            if (current && other && current.getTime() < other.getTime()) {
              const label = name === 'after' ? 'after' : 'after or equal to'
              fieldErrors.push(`The ${attr} must be a date ${label} ${humanize(param)}.`)
            }
            break
          }

          case 'before_or_equal':
          case 'before': {
            const other = dateOf(source[param])
            const current = dateOf(value)
            if (current && other && current.getTime() > other.getTime()) {
              const label = name === 'before' ? 'before' : 'before or equal to'
              fieldErrors.push(`The ${attr} must be a date ${label} ${humanize(param)}.`)
            }
            break
          }

          case 'confirmed': {
            const confirmation = source[`${field}_confirmation`]
            if (String(confirmation ?? '') !== String(value ?? '')) {
              fieldErrors.push(`The ${attr} confirmation does not match.`)
            }
            break
          }

          case 'exists': {
            const [table, column = 'id'] = String(param).split(',')
            const row = await db.get(`SELECT COUNT(*)::int AS c FROM ${table} WHERE ${column} = ?`, value)
            if (!row || Number(row.c) < 1) {
              fieldErrors.push(`The selected ${attr} is invalid.`)
            }
            break
          }

          case 'unique': {
            const [table, column = 'id', ignoreId = '0'] = String(param).split(',')
            const row = await db.get(
              `SELECT COUNT(*)::int AS c FROM ${table} WHERE ${column} = ? AND id != ?`,
              value,
              Number(ignoreId) || 0
            )
            if (row && Number(row.c) > 0) {
              fieldErrors.push(`The ${attr} has already been taken.`)
            }
            break
          }

          // File rules are validated separately (multer uploads).
          case 'image':
          case 'file':
          case 'mimes':
          case 'mimetypes':
            break

          default:
            break
        }
      }

      if (fieldErrors.length > 0) {
        errors[field] = fieldErrors
      } else {
        values[field] = value
      }
    }

    return { ok: Object.keys(errors).length === 0, errors, values }
  }
}

/** Validate an uploaded image/file (multer memory storage `file`). */
function fileError(file, { label, maxKb = 10240, mimes = null, imagesOnly = false } = {}) {
  const attr = humanize(label || 'file')
  if (!file) return [`The ${attr} field is required.`]
  const mime = file.mimetype || ''
  if (imagesOnly && !mime.startsWith('image/')) {
    return [`The ${attr} must be an image.`]
  }
  if (Array.isArray(mimes) && mimes.length > 0 && !mimes.includes(mime)) {
    return [`The ${attr} field must be a file of type: ${mimes.join(', ')}.`]
  }
  if (file.size > maxKb * 1024) {
    return [`The ${attr} must not be greater than ${maxKb} kilobytes.`]
  }
  return []
}

module.exports = { createValidator, fileError }
