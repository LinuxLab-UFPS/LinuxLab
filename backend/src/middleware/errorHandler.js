const { Prisma } = require("@prisma/client")
const logger = require("../lib/logger")
const { AppError } = require("../lib/errors")

function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    logger.error({ reqId: req.id, err }, "Error after headers sent")
    return
  }

  if (err instanceof AppError) {
    const body = { error: err.message, code: err.code }
    if (err.details !== undefined) body.details = err.details

    if (err.statusCode >= 500) {
      logger.error({ reqId: req.id, err, method: req.method, path: req.originalUrl }, "Application error")
    } else {
      logger.warn({ reqId: req.id, err, method: req.method, path: req.originalUrl }, "Request rejected")
    }
    return res.status(err.statusCode).json(body)
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      logger.warn({ reqId: req.id, err, path: req.originalUrl }, "Unique constraint violation")
      return res.status(409).json({ error: "El recurso ya existe", code: "CONFLICT" })
    }
    if (err.code === "P2025") {
      logger.warn({ reqId: req.id, err, path: req.originalUrl }, "Record not found")
      return res.status(404).json({ error: "Recurso no encontrado", code: "NOT_FOUND" })
    }
  }

  logger.error({ reqId: req.id, err, method: req.method, path: req.originalUrl }, "Unhandled application error")
  return res.status(500).json({ error: "Error interno del servidor", code: "INTERNAL_ERROR" })
}

module.exports = errorHandler
