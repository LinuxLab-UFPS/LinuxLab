const express = require("express")
const jwt = require("jsonwebtoken")
const { getAuth } = require("firebase-admin/auth")
const firebaseApp = require("../config/firebase-admin")
const prisma = require("../../prisma/client")
const authMiddleware = require("../middleware/auth")
const enrollmentService = require("../services/enrollmentService")
const logger = require("../lib/logger")
const config = require("../config/env")

const router = express.Router()

const USER_INCLUDE = {
  linuxAccount: {
    select: {
      linux_username: true,
      linux_provisioned: true,
    },
  },
  preferences: true,
}

function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    googleId: user.google_id,
    active: user.active,
    linuxUsername: user.linuxAccount?.linux_username ?? null,
    linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
    preferences: user.preferences
      ? {
          terminalFontSize: user.preferences.terminal_font_size,
          terminalFontFamily: user.preferences.terminal_font_family,
          theme: user.preferences.theme,
        }
      : null,
  }
}

router.post("/firebase", async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) {
      return res.status(400).json({ error: "Se requiere el token de acceso", code: "VALIDATION_ERROR" })
    }

    if (!firebaseApp) {
      return res.status(500).json({ error: "Firebase no está configurado en el servidor", code: "INTERNAL_ERROR" })
    }

    const auth = getAuth(firebaseApp)
    const decoded = await auth.verifyIdToken(idToken)
    const { email, name, uid, picture } = decoded

    if (!email) {
      return res.status(400).json({ error: "Se requiere un correo electrónico", code: "VALIDATION_ERROR" })
    }

    // if (!email.endsWith("@ufps.edu.co")) {
    //   return res.status(403).json({ error: "Solo se permiten correos institucionales @ufps.edu.co" })
    // }

    let user = await prisma.user.findUnique({
      where: { email },
      include: USER_INCLUDE,
    })

    if (!user) {
      return res.status(401).json({ error: "El usuario no está registrado en la plataforma", code: "UNAUTHORIZED" })
    }

    if (!user.active) {
      return res.status(403).json({ error: "Cuenta desactivada. Contacta al administrador.", code: "FORBIDDEN" })
    }

    // Al archivar un grupo (fin de semestre) las matriculas pasan a 'archived'
    // y se borra la cuenta Linux. Sin matricula activa el estudiante no tiene
    // nada que hacer en la plataforma.
    if (user.role === "student" && !(await enrollmentService.hasActiveEnrollment(user.id))) {
      return res.status(403).json({
        error: "No te encuentras registrado en ningún grupo de laboratorio",
        code: "FORBIDDEN",
      })
    }

    if (!user.google_id) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { google_id: uid },
        include: USER_INCLUDE,
      })
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn },
    )

    res.cookie(config.jwt.cookieName, token, config.jwt.cookie)

    res.json({ user: serializeUser(user) })
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "La sesión de Google expiró", code: "UNAUTHORIZED" })
    }
    if (error.code === "auth/argument-error") {
      return res.status(400).json({ error: "Token inválido", code: "VALIDATION_ERROR" })
    }
    // El detalle del error de Firebase/BD no debe llegar al cliente: se
    // registra en el log y se responde con un mensaje generico.
    logger.error({ err: error }, "Firebase auth error")
    res.status(500).json({ error: "Error al iniciar sesión", code: "INTERNAL_ERROR" })
  }
})

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: USER_INCLUDE,
    })
    if (!user) {
      res.clearCookie(config.jwt.cookieName, { path: "/" })
      return res.status(401).json({ error: "Usuario no encontrado", code: "UNAUTHORIZED" })
    }
    if (!user.active) {
      res.clearCookie(config.jwt.cookieName, { path: "/" })
      return res.status(403).json({ error: "Cuenta desactivada", code: "FORBIDDEN" })
    }
    // Misma regla que en el login: una sesion JWT dura 7 dias y puede seguir
    // viva despues de que se archive el grupo del estudiante.
    if (user.role === "student" && !(await enrollmentService.hasActiveEnrollment(user.id))) {
      res.clearCookie(config.jwt.cookieName, { path: "/" })
      return res.status(403).json({
        error: "No te encuentras registrado en ningún grupo de laboratorio",
        code: "FORBIDDEN",
      })
    }
    res.json({ user: serializeUser(user) })
  } catch (error) {
    logger.error({ err: error }, "Auth me error")
    res.status(500).json({ error: "Error al obtener la sesión", code: "INTERNAL_ERROR" })
  }
})

router.post("/logout", authMiddleware, (_req, res) => {
  res.clearCookie(config.jwt.cookieName, { path: "/" })
  res.json({ message: "Sesión cerrada" })
})

module.exports = router
