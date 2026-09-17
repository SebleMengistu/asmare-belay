'use strict'

/** Uniform JSON envelope: { success, message, data, errors } (+ meta). */

class ApiError extends Error {
  constructor(message, status = 400, errors = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

class NotFoundError extends ApiError {
  constructor(message = 'Resource not found.') {
    super(message, 404)
  }
}

class UnauthorizedError extends ApiError {
  constructor() {
    super('Unauthenticated.', 401)
  }
}

class ForbiddenError extends ApiError {
  constructor() {
    super('This action is unauthorized.', 403)
  }
}

class ValidationError extends ApiError {
  constructor(errors, message = 'The given data was invalid.') {
    super(message, 422, errors)
  }
}

function attachResponder(req, res, next) {
  res.respond = (data = null, message = 'OK', status = 200, meta = {}, errors = null) => {
    const payload = {
      success: status >= 200 && status < 300,
      message,
      data,
      errors,
    }
    if (meta && Object.keys(meta).length > 0) payload.meta = meta
    res.status(status).json(payload)
  }

  res.ok = (data = null, message = 'OK', meta = {}) => res.respond(data, message, 200, meta)
  res.created = (data = null, message = 'Created', status = 201) => res.respond(data, message, status)
  res.noContent = (message = 'No Content') => res.respond(null, message, 204)
  res.error = (message, status = 400, errors = null) => res.respond(null, message, status, {}, errors)

  next()
}

/** Wrap async handlers so rejections reach the error middleware. */
function wrap(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next)
}

module.exports = {
  ApiError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  attachResponder,
  wrap,
}
