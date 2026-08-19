const express = require("express")
const authMiddleware = require("../middleware/authMiddleware")
const authService = require("../services/authService")
const config = require("../config/env")
const { idTokenSchema } = require("../dtos/authDtos")
const { parseOrThrow } = require("../dtos/common")
const { serializeUser } = require("../dtos/userDtos")
const asyncHandler = require("../utils/asyncHandler")
const { AppError } = require("../lib/errors")
const auditService = require("../services/auditService")

const router = express.Router()

router.post(
  "/firebase",
  asyncHandler(async (req, res) => {
    const { idToken } = parseOrThrow(idTokenSchema, req.body ?? {})
    const user = await authService.loginWithIdToken({ idToken, req })
    res.cookie(config.jwt.cookieName, authService.signSession(user), config.jwt.cookie)
    res.json({ user: serializeUser(user) })
  }),
)

router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
      res.json({ user: serializeUser(await authService.getSessionUser(req.user.id)) })
    } catch (err) {
      // Sesion invalida o sin acceso: la cookie deja de servir y se limpia
      // para que el navegador no la siga mandando. Un error de servidor (500)
      // no debe borrarla.
      if (err instanceof AppError && err.statusCode >= 401 && err.statusCode < 500) {
        res.clearCookie(config.jwt.cookieName, { path: "/" })
      }
      throw err
    }
  }),
)

router.post("/logout", authMiddleware, asyncHandler(async (req, res) => {
  const { ip, userAgent, actorRole } = auditService.requestMeta(req)
  await auditService.audit({
    userId: req.user.id,
    eventType: "auth_logout",
    target: req.user.email,
    metadata: { email: req.user.email },
    actorRole: actorRole ?? req.user.role,
    ip,
    userAgent,
  })
  res.clearCookie(config.jwt.cookieName, { path: "/" })
  res.json({ message: "Sesión cerrada" })
}))

module.exports = router
