const prisma = require("../../prisma/client")
const logger = require("../lib/logger")
const { AppError } = require("../lib/errors")
const { userExists } = require("./linuxContainerService")

function groupNameOf(group) {
  return group.group_dir
    ? `grp_${group.id.replace(/-/g, "").substring(0, 8)}`
    : null
}

async function reconcileGroup({ groupId }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { teacher: { include: { linuxAccount: true } } },
  })
  if (!group) {
    throw new AppError("Grupo no encontrado", 404, "NOT_FOUND")
  }
  if (group.archived) {
    // El teardown del archivo borro los usuarios del entorno: re-aprovisionar
    // los recrearia de la nada y sin matricula activa no tiene sentido.
    return { checked: 0, orphaned: 0, requeued: 0 }
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    include: { student: { include: { linuxAccount: true } } },
  })

  const teacherUsername = group.teacher.linuxAccount?.linux_username ?? null
  let orphaned = 0
  let requeued = 0

  for (const { student } of enrollments) {
    const account = student.linuxAccount
    if (!account) continue
    try {
      if (await userExists(account.linux_username)) continue
      orphaned += 1
      await prisma.linuxAccount.update({
        where: { user_id: account.user_id },
        data: { linux_provisioned: false },
      })
      await prisma.userProvisioningJob.create({
        data: {
          user_id: account.user_id,
          username: account.linux_username,
          group_id: group.id,
          group_dir: group.group_dir,
          group_name: groupNameOf(group),
          teacher_username: teacherUsername,
        },
      })
      requeued += 1
    } catch (err) {
      logger.error({ err, username: account.linux_username }, "Reconcile check failed")
    }
  }

  return { checked: enrollments.length, orphaned, requeued }
}

async function reconcileAll() {
  const accounts = await prisma.linuxAccount.findMany({
    where: { linux_provisioned: true },
  })

  let orphaned = 0
  let requeued = 0

  for (const account of accounts) {
    try {
      if (await userExists(account.linux_username)) continue
      orphaned += 1
      await prisma.linuxAccount.update({
        where: { user_id: account.user_id },
        data: { linux_provisioned: false },
      })

      const enrollment = await prisma.enrollment.findFirst({
        where: { student_id: account.user_id },
        include: { group: { include: { teacher: { include: { linuxAccount: true } } } } },
        orderBy: { enrolled_at: "desc" },
      })

      await prisma.userProvisioningJob.create({
        data: enrollment
          ? {
              user_id: account.user_id,
              username: account.linux_username,
              group_id: enrollment.group_id,
              group_dir: enrollment.group.group_dir,
              group_name: groupNameOf(enrollment.group),
              teacher_username: enrollment.group.teacher.linuxAccount?.linux_username ?? null,
            }
          : {
              user_id: account.user_id,
              username: account.linux_username,
              group_id: null,
              group_dir: null,
              group_name: null,
              teacher_username: null,
            },
      })
      requeued += 1
    } catch (err) {
      logger.error({ err, username: account.linux_username }, "Reconcile check failed")
    }
  }

  return { checked: accounts.length, orphaned, requeued }
}

module.exports = { reconcileGroup, reconcileAll }
