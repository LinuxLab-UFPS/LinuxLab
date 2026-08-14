const prisma = require("../../prisma/client")

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

module.exports = { hasEnrollmentInGroup }
