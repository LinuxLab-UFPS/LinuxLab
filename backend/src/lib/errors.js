class AppError extends Error {
  constructor(message, statusCode = 500, code = "INTERNAL_ERROR", details = undefined) {
    super(message)
    this.name = "AppError"
    this.statusCode = statusCode
    this.status = statusCode
    this.code = code === "INTERNAL_ERROR" ? codeForStatus(statusCode) : code
    this.details = details
    Error.captureStackTrace?.(this, this.constructor)
  }
}

function codeForStatus(statusCode) {
  return {
    400: "VALIDATION_ERROR",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    409: "CONFLICT",
  }[statusCode] ?? "INTERNAL_ERROR"
}

class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, "VALIDATION_ERROR", details)
  }
}

class AuthorizationError extends AppError {
  constructor(message = "No tienes permiso para realizar esta operación") {
    super(message, 403, "FORBIDDEN")
  }
}

class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(message, 404, "NOT_FOUND")
  }
}

class ConflictError extends AppError {
  constructor(message, details) {
    super(message, 409, "CONFLICT", details)
  }
}

module.exports = {
  AppError,
  ValidationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
}
