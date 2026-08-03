const { Prisma } = require("@prisma/client")
const logger = require("../lib/logger")
const { AppError } = require("../lib/errors")

function errorHandler(err, req, res, _next) {
  if (res.headersSent) return

  if (err instanceof AppError) {
    const body = { error: err.message, code: err.code }
    if (err.details !== undefined) body.details = err.details
    return res.status(err.statusCode).json(body)
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "El recurso ya existe", code: "CONFLICT" })
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Recurso no encontrado", code: "NOT_FOUND" })
    }
  }

  logger.error({ err, method: req.method, path: req.originalUrl }, "Unhandled application error")
  return res.status(500).json({ error: "Error interno del servidor", code: "INTERNAL_ERROR" })
}

module.exports = errorHandler
