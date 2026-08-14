const jwt = require("jsonwebtoken")
const { getAuth } = require("firebase-admin/auth")
const firebaseApp = require("../config/firebase-admin")
const prisma = require("../../prisma/client")
const enrollmentService = require("./enrollmentService")
const logger = require("../lib/logger")
const { AppError } = require("../lib/errors")
const config = require("../config/env")

const USER_INCLUDE = {
  linuxAccount: {
    select: {
      linux_username: true,
      linux_provisioned: true,
    },
  },
  preferences: true,
}

/**
 * Verifica el token de Firebase, ubica al usuario en la base y valida que
 * pueda entrar (activo, y con matricula activa si es estudiante).
 */
async function loginWithIdToken({ idToken }) {
  if (!firebaseApp) {
    throw new AppError("Firebase no está configurado en el servidor", 500, "INTERNAL_ERROR")
  }

  let decoded
  try {
    const auth = getAuth(firebaseApp)
    decoded = await auth.verifyIdToken(idToken)
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      throw new AppError("La sesión de Google expiró", 401, "UNAUTHORIZED")
    }
    if (error.code === "auth/argument-error") {
      throw new AppError("Token inválido", 400, "VALIDATION_ERROR")
    }

    logger.error({ err: error }, "Firebase auth error")
    throw new AppError("Error al iniciar sesión", 500, "INTERNAL_ERROR")
  }

  const { email, uid } = decoded
  if (!email) {
    throw new AppError("Se requiere un correo electrónico", 400, "VALIDATION_ERROR")
  }

  let user = await prisma.user.findUnique({
    where: { email },
    include: USER_INCLUDE,
  })

  if (!user) {
    throw new AppError("El usuario no está registrado en la plataforma", 401, "UNAUTHORIZED")
  }

  if (!user.active) {
    throw new AppError("Cuenta desactivada. Contacta al administrador.", 403, "FORBIDDEN")
  }

  if (user.role === "student" && !(await enrollmentService.hasActiveEnrollment(user.id))) {
    throw new AppError("No te encuentras registrado en ningún grupo de laboratorio", 403, "FORBIDDEN")
  }

  if (!user.google_id) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { google_id: uid },
      include: USER_INCLUDE,
    })
  }

  return user
}

/** Devuelve el usuario de la sesion, con las mismas reglas que el login. */
async function getSessionUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: USER_INCLUDE,
  })
  if (!user) {
    throw new AppError("Usuario no encontrado", 401, "UNAUTHORIZED")
  }
  if (!user.active) {
    throw new AppError("Cuenta desactivada", 403, "FORBIDDEN")
  }
  // Misma regla que en el login: una sesion JWT dura 7 dias y puede seguir
  // viva despues de que se archive el grupo del estudiante.
  if (user.role === "student" && !(await enrollmentService.hasActiveEnrollment(user.id))) {
    throw new AppError("No te encuentras registrado en ningún grupo de laboratorio", 403, "FORBIDDEN")
  }
  return user
}

/** Firma la cookie de sesion del usuario. */
function signSession(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  )
}

/** Verifica un JWT de sesion. Es la unica implementacion (HTTP y WS). */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret)
}

module.exports = { loginWithIdToken, getSessionUser, signSession, verifyToken, USER_INCLUDE }
