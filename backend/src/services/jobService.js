const prisma = require("../../prisma/client")
const { serializeTeacherUserJob } = require("../dtos/provisioningDtos")

/** Jobs de aprovisionamiento de todos los docentes (vista de admin). */
async function listTeacherProvisioningJobs() {
  const teachers = await prisma.user.findMany({
    where: { teacher: { isNot: null } },
    select: { id: true },
  })
  const teacherIds = teachers.map((t) => t.id)
  const jobs = await prisma.job.findMany({
    where: {
      type: "user_provisioning",
      user_id: { in: teacherIds },
      group_id: null,
    },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { created_at: "desc" },
  })
  return jobs.map(serializeTeacherUserJob)
}

module.exports = { listTeacherProvisioningJobs }
