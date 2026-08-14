const config = require("../config/env")
const authService = require("../services/authService")
const { AppError } = require("../lib/errors")

function authMiddleware(req, res, next) {
  const token = req.cookies?.[config.jwt.cookieName]

  if (!token) {
    return next(new AppError("Sesión no encontrada", 401, "UNAUTHORIZED"))
  }

  try {
    req.user = authService.verifyToken(token)
    next()
  } catch {
    next(new AppError("Sesión inválida o expirada", 401, "UNAUTHORIZED"))
  }
}

module.exports = authMiddleware
