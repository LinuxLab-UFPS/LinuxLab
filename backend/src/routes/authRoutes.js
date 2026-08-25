const express = require("express")
const { getAuth } = require("firebase-admin/auth")
const firebaseApp = require("../config/firebase-admin")
const authMiddleware = require("../middleware/authMiddleware")
const authService = require("../services/authService")
const config = require("../config/env")
const { idTokenSchema, requestEmailSchema } = require("../dtos/authDtos")
const { parseOrThrow } = require("../dtos/common")
const { serializeUser } = require("../dtos/userDtos")
const asyncHandler = require("../utils/asyncHandler")
const { AppError } = require("../lib/errors")
const auditService = require("../services/auditService")
const enrollmentService = require("../services/enrollmentService")
const logger = require("../lib/logger")
const emailService = require("../services/emailService")

const router = express.Router()

function extractOobCode(firebaseLink) {
  try {
    const url = new URL(firebaseLink)
    return url.searchParams.get("oobCode")
  } catch {
    return null
  }
}

router.post(
  "/request-password-reset",
  asyncHandler(async (req, res) => {
    const { email } = parseOrThrow(requestEmailSchema, req.body ?? {})
    if (!firebaseApp) {
      throw new AppError("Firebase no está configurado en el servidor", 500, "INTERNAL_ERROR")
    }
    try {
      const auth = getAuth(firebaseApp)
      const firebaseLink = await auth.generatePasswordResetLink(email)
      const oobCode = extractOobCode(firebaseLink)
      const customLink = `${config.frontendUrl}/auth/reset-password?oobCode=${encodeURIComponent(oobCode ?? "")}`
      const { subject, html, text } = emailService.renderResetPasswordEmail(customLink)
      try {
        await emailService.sendMail({ to: email, subject, html, text, category: "password_reset" })
        logger.info({ email }, "password reset email enviado")
      } catch (mailErr) {
        logger.error({ err: mailErr, email }, "Fallo envío email reset")
        if (config.email.provider === "log") throw mailErr
      }
      res.json({ message: "Si el correo existe, se ha enviado el enlace de recuperación." })
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        logger.info({ email }, "password reset solicitado para usuario inexistente (respuesta genérica)")
        return res.json({ message: "Si el correo existe, se ha enviado el enlace de recuperación." })
      }
      if (err instanceof AppError) throw err
      logger.error({ err, email }, "Error generando password reset link")
      throw new AppError(err.message || "No se pudo generar el enlace", 500, "INTERNAL_ERROR")
    }
  }),
)

router.post(
  "/request-verification",
  asyncHandler(async (req, res) => {
    const { email } = parseOrThrow(requestEmailSchema, req.body ?? {})
    if (!firebaseApp) {
      throw new AppError("Firebase no está configurado en el servidor", 500, "INTERNAL_ERROR")
    }
    try {
      const auth = getAuth(firebaseApp)
      const firebaseLink = await auth.generateEmailVerificationLink(email)
      const oobCode = extractOobCode(firebaseLink)
      const customLink = `${config.frontendUrl}/auth/accion?mode=verifyEmail&oobCode=${encodeURIComponent(oobCode ?? "")}`
      const { subject, html, text } = emailService.renderVerificationEmail(customLink)
      try {
        await emailService.sendMail({ to: email, subject, html, text, category: "verification" })
        logger.info({ email }, "verification email enviado")
      } catch (mailErr) {
        logger.error({ err: mailErr, email }, "Fallo envío email verificación")
        if (config.email.provider === "log") throw mailErr
      }
      res.json({ message: "Si el correo existe, se ha enviado el enlace de verificación." })
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        logger.info({ email }, "verification solicitado para usuario inexistente (respuesta genérica)")
        return res.json({ message: "Si el correo existe, se ha enviado el enlace de verificación." })
      }
      if (err instanceof AppError) throw err
      logger.error({ err, email }, "Error generando verification link")
      throw new AppError(err.message || "No se pudo generar el enlace", 500, "INTERNAL_ERROR")
    }
  }),
)

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
  // Para el estudiante se liga el grupo activo (igual que en el login), de modo
  // que el docente vea el cierre de sesion en la bitacora de su curso.
  const groupId =
    req.user.role === "student" ? await enrollmentService.getActiveGroupId(req.user.id) : null
  await auditService.audit({
    userId: req.user.id,
    groupId,
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
