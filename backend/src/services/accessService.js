const prisma = require("../../prisma/client")
const { AppError } = require("../lib/errors")

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Verifica que el docente (o admin) tenga acceso al grupo y lo devuelve.
 *
 * Es la unica implementacion de control de acceso por grupo: todos los
 * endpoints por grupo pasan por aqui.
 */
async function ensureGroupAccess({ groupId, teacherUserId, role, tx = prisma }) {
  // Un id que no es UUID hace fallar el cast en Postgres con un error crudo de
  // 500; aqui se traduce a un 404 limpio.
  if (!UUID_REGEX.test(groupId)) {
    throw new AppError("Grupo no encontrado", 404, "NOT_FOUND")
  }
  const group = await tx.group.findUnique({ where: { id: groupId } })
  if (!group) {
    throw new AppError("Grupo no encontrado", 404, "NOT_FOUND")
  }
  if (role !== "admin" && group.teacher_id !== teacherUserId) {
    throw new AppError("No tienes permiso sobre este grupo", 403, "FORBIDDEN")
  }
  return group
}

/** Matricula activa del estudiante en un grupo concreto (no global). */
async function hasEnrollmentInGroup(studentUserId, groupId) {
  const count = await prisma.enrollment.count({
    where: {
      student_id: studentUserId,
      group_id: groupId,
      status: "active",
      group: { archived: false },
    },
  })
  return count > 0
}

module.exports = { ensureGroupAccess, hasEnrollmentInGroup }
