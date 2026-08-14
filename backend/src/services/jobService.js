const prisma = require("../../prisma/client")
const { serializeTeacherUserJob } = require("../dtos/provisioningDtos")

/** Jobs de aprovisionamiento de todos los docentes (vista de admin). */
async function listTeacherProvisioningJobs() {
  const teachers = await prisma.user.findMany({
    where: { role: "teacher" },
    select: { id: true },
  })
  const teacherIds = teachers.map((t) => t.id)
  const jobs = await prisma.userProvisioningJob.findMany({
    where: {
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
