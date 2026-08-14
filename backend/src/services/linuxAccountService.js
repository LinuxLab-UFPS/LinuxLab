const prisma = require("../../prisma/client")
const enrollmentService = require("./enrollmentService")
const { AppError, AuthorizationError } = require("../lib/errors")

/** Nombres de cuenta que puede haber en el contenedor. */
const USERNAME = /^[a-z_][a-z0-9_-]{0,31}$/

/**
 * Comprobaciones comunes antes de tocar el entorno de un estudiante.
 *
 * Se hacen en el mismo orden y con los mismos mensajes tanto para evaluar como
 * para preparar el directorio de trabajo: si la matricula no vale para una cosa,
 * tampoco vale para la otra.
 */
async function getStudentAccount(studentUserId) {
  if (!(await enrollmentService.hasActiveEnrollment(studentUserId))) {
    throw new AuthorizationError("No estás inscrito en ningún curso activo")
  }

  const account = await prisma.linuxAccount.findUnique({ where: { user_id: studentUserId } })
  if (!account?.linux_username) {
    throw new AppError("Todavía no tienes cuenta en el entorno", 409, "CONFLICT")
  }
  if (!account.linux_provisioned) {
    throw new AppError("Tu cuenta del entorno se está creando, intenta en un momento", 409, "CONFLICT")
  }
  if (!USERNAME.test(account.linux_username)) {
    throw new AppError("El nombre de tu cuenta no es válido", 500, "INTERNAL_ERROR")
  }
  return account
}

module.exports = { getStudentAccount, USERNAME }
