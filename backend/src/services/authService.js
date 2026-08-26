const crypto = require("crypto")
const jwt = require("jsonwebtoken")
const { getAuth } = require("firebase-admin/auth")
const firebaseApp = require("../config/firebase-admin")
const prisma = require("../../prisma/client")
const enrollmentService = require("./enrollmentService")
const logger = require("../lib/logger")
const { AppError } = require("../lib/errors")
const config = require("../config/env")
const auditService = require("./auditService")
const emailService = require("./emailService")

const USER_INCLUDE = {
  linuxAccount: {
    select: {
      linux_username: true,
      linux_provisioned: true,
    },
  },
  student: { select: { code: true } },
  teacher: { select: { code: true } },
  settings: true,
}

/**
 * Verifica el token de Firebase, ubica al usuario en la base y valida que
 * pueda entrar (activo, y con matricula activa si es estudiante).
 */
async function loginWithIdToken({ idToken, req }) {
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

  const { email, uid, email_verified } = decoded
  if (!email) {
    throw new AppError("Se requiere un correo electrónico", 400, "VALIDATION_ERROR")
  }
  if (email_verified === false) {
    throw new AppError("Debes verificar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.", 403, "FORBIDDEN")
  }

  let user = await prisma.user.findUnique({
    where: { email },
    include: USER_INCLUDE,
  })

  if (!user) {
    const displayName = (decoded.name || decoded.email?.split("@")[0] || "Estudiante").trim()
    const { createLinuxAccountWithUniqueUsername } = require("../utils/linuxUsername")
    user = await prisma.user.create({
      data: {
        email,
        name: displayName,
        role: "student",
        active: true,
        google_id: uid,
      },
      include: USER_INCLUDE,
    })
    try {
      await createLinuxAccountWithUniqueUsername(prisma, user.id, email)
      user = await prisma.user.findUnique({ where: { id: user.id }, include: USER_INCLUDE })
    } catch {}
  }

  if (!user.active) {
    throw new AppError("Cuenta desactivada. Contacta al administrador.", 403, "FORBIDDEN")
  }

  const hasEnrollment = user.role !== "student" || (await enrollmentService.hasActiveEnrollment(user.id))

  const updates = { last_login: new Date() }
  if (!user.google_id) {
    updates.google_id = uid
  }
  user = await prisma.user.update({
    where: { id: user.id },
    data: updates,
    include: USER_INCLUDE,
  })

  // Bitácora: inicio de sesión. Para los estudiantes se liga el grupo activo
  // (el docente audita las sesiones de su curso); para docentes y admin no.
  const { ip, userAgent, actorRole } = auditService.requestMeta(req)
  const groupId = hasEnrollment && user.role === "student" ? await enrollmentService.getActiveGroupId(user.id) : null
  await auditService.audit({
    userId: user.id,
    groupId,
    eventType: "auth_login",
    target: user.email,
    metadata: { email: user.email, hasEnrollment },
    actorRole: actorRole ?? user.role,
    ip,
    userAgent,
  })

  return { ...user, hasEnrollment }
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
  const hasEnrollment = user.role !== "student" || (await enrollmentService.hasActiveEnrollment(user.id))
  return { ...user, hasEnrollment }
}

/** Firma la cookie de sesion del usuario. */
function signSession(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      code: user.student?.code ?? user.teacher?.code ?? null,
      hasEnrollment: user.hasEnrollment ?? false,
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn },
  )
}

function extractOobCode(firebaseLink) {
  try {
    const url = new URL(firebaseLink)
    return url.searchParams.get("oobCode")
  } catch {
    return null
  }
}

/**
 * Crea (si no existe) la cuenta Firebase del docente con una contraseña
 * aleatoria y envía el enlace de configuración: un reset de Firebase que
 * apunta a /auth/setup-account. La contraseña aleatoria NUNCA se persiste;
 * el docente la reemplaza por la suya vía el enlace. Si el envío falla
 * (y el provider no es "log") se devuelve `debugLink` para usar en dev.
 */
async function inviteTeacher({ email, name }) {
  if (!firebaseApp) {
    logger.info({ email }, "inviteTeacher: Firebase no configurado, omitiendo cuenta Auth")
    return { debugLink: undefined }
  }
  const auth = getAuth(firebaseApp)
  try {
    try {
      await auth.getUserByEmail(email)
    } catch {
      await auth.createUser({
        email,
        password: crypto.randomBytes(12).toString("hex"),
        displayName: name,
        emailVerified: true,
      })
    }
    const firebaseLink = await auth.generatePasswordResetLink(email)
    const oobCode = extractOobCode(firebaseLink)
    const setupUrl = `${config.frontendUrl}/auth/setup-account?oobCode=${encodeURIComponent(oobCode ?? "")}`
    const { subject, html, text } = emailService.renderSetupAccountEmail(setupUrl)
    try {
      await emailService.sendMail({ to: email, subject, html, text, category: "teacher_invite" })
      logger.info({ email }, "invitación de docente enviada")
      return { debugLink: undefined }
    } catch (mailErr) {
      logger.error({ err: mailErr, email }, "Fallo envío email invitación docente")
      throw new AppError("No se pudo enviar la invitación por correo", 500, "EMAIL_SEND_FAILED")
    }
  } catch (err) {
    if (err instanceof AppError) throw err
    logger.error({ err, email }, "Error en inviteTeacher")
    throw new AppError(err.message || "No se pudo enviar la invitación", 500, "INTERNAL_ERROR")
  }
}

/** Verifica un JWT de sesion. Es la unica implementacion (HTTP y WS). */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret)
}

module.exports = { loginWithIdToken, getSessionUser, signSession, verifyToken, USER_INCLUDE, inviteTeacher }
