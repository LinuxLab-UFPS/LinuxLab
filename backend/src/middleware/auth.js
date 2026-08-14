const jwt = require("jsonwebtoken")
const config = require("../config/env")
const { AppError } = require("../lib/errors")

function authMiddleware(req, res, next) {
  const token = req.cookies?.[config.jwt.cookieName]

  if (!token) {
    return next(new AppError("Sesión no encontrada", 401, "UNAUTHORIZED"))
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    req.user = decoded
    next()
  } catch {
    next(new AppError("Sesión inválida o expirada", 401, "UNAUTHORIZED"))
  }
}

module.exports = authMiddleware
