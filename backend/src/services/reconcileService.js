const prisma = require("../../prisma/client")
const logger = require("../lib/logger")
const { AppError } = require("../lib/errors")
const {
  userExists,
  groupExists,
  homeOwnedBy,
  inGroup,
  repairGroupOwnership,
} = require("./containerService")
const { groupNameOf: groupNameFromId } = require("../utils/groupName")
const { PRIORITIES } = require("../lib/constants")

function groupNameOf(group) {
  return group.group_dir ? groupNameFromId(group.id) : null
}

/**
 * El reconcile reconstruye el entorno desde la base de datos: es el mecanismo
 * de recuperacion tras una perdida de volumen o contenedor. Sigue el mismo
 * orden jerarquico del aprovisionamiento: docentes primero, grupos despues y
 * estudiantes al final, para que ninguna dependencia quede sin resolver.
 */
async function reconcileAll() {
  const out = { teachers: 0, groups: 0, students: 0, admins: 0 }

  // 1. Docentes: si su usuario Linux falta, se encola su job (prioridad 10).
  const teachers = await prisma.user.findMany({
    where: { teacher: { isNot: null }, linuxAccount: { linux_provisioned: true } },
    include: { linuxAccount: true },
  })
  for (const teacher of teachers) {
    try {
      if (await userExists(teacher.linuxAccount.linux_username)) continue
      out.teachers += 1
      await prisma.linuxAccount.update({
        where: { user_id: teacher.linuxAccount.user_id },
        data: { linux_provisioned: false },
      })
      await prisma.job.create({
        data: {
          type: "user_provisioning",
          priority: PRIORITIES.TEACHER,
          user_id: teacher.linuxAccount.user_id,
          payload: { username: teacher.linuxAccount.linux_username },
        },
      })
    } catch (err) {
      logger.error({ err, username: teacher.linuxAccount.linux_username }, "Reconcile teacher failed")
    }
  }

  // 1b. Admins: tienen linuxAccount y necesitan usuario Linux para la terminal,
  //     pero no tienen relacion teacher/student, asi que el paso de docentes los
  //     omite. El job es igual al de docente (prioridad 10, sin grupo): el
  //     worker lo enruta a provisionTeacherAccount y crea usuario + home.
  const admins = await prisma.user.findMany({
    where: { role: "admin", linuxAccount: { linux_provisioned: true } },
    include: { linuxAccount: true },
  })
  for (const admin of admins) {
    try {
      if (await userExists(admin.linuxAccount.linux_username)) continue
      out.admins += 1
      await prisma.linuxAccount.update({
        where: { user_id: admin.linuxAccount.user_id },
        data: { linux_provisioned: false },
      })
      await prisma.job.create({
        data: {
          type: "user_provisioning",
          priority: PRIORITIES.TEACHER,
          user_id: admin.linuxAccount.user_id,
          payload: { username: admin.linuxAccount.linux_username },
        },
      })
    } catch (err) {
      logger.error({ err, username: admin.linuxAccount.linux_username }, "Reconcile admin failed")
    }
  }

  // 2. Grupos activos: si el grupo Unix falta se encola su job (prioridad 5);
  //    si existe, el directorio debe ser del docente (se repara idempotente).
  const groups = await prisma.group.findMany({
    where: { status: "active", group_dir: { not: null } },
    include: { teacher: { include: { user: { include: { linuxAccount: true } } } } },
  })
  for (const group of groups) {
    const groupName = groupNameOf(group)
    const teacherUsername = group.teacher?.user?.linuxAccount?.linux_username
    if (!groupName || !teacherUsername) continue
    try {
      if (!(await groupExists(groupName))) {
        out.groups += 1
        await prisma.job.create({
          data: {
            type: "group_provisioning",
            priority: PRIORITIES.GROUP,
            group_id: group.id,
            payload: {
              group_dir: group.group_dir,
              group_name: groupName,
              teacher_username: teacherUsername,
            },
          },
        })
      } else {
        // El grupo existe: el directorio debe ser del docente (pudo nacer
        // como root:grp si el docente aun no estaba provisionado).
        await repairGroupOwnership(teacherUsername, group.group_dir, groupName)
      }
    } catch (err) {
      logger.error({ err, groupDir: group.group_dir }, "Reconcile group failed")
    }
  }

  // 3. Estudiantes con matricula activa: si faltan o su home no es suyo, se
  //    encola su job (prioridad 1). El home roto (root:root) se detecta por
  //    uid, no solo por la existencia del usuario.
  const enrollments = await prisma.enrollment.findMany({
    where: { status: "active", group: { status: "active" } },
    include: {
      student: { include: { user: { include: { linuxAccount: true } } } },
      group: { include: { teacher: { include: { user: { include: { linuxAccount: true } } } } } },
    },
  })
  for (const { student, group } of enrollments) {
    const account = student.user?.linuxAccount
    if (!account) continue
    const groupName = groupNameOf(group)
    const teacherUsername = group.teacher?.user?.linuxAccount?.linux_username
    try {
      if (await userExists(account.linux_username)) {
        // La membresia se mira aparte del home: un estudiante creado antes de
        // que el aprovisionamiento la anadiera tiene el home correcto y sigue
        // fuera del grupo, y solo re-aprovisionando se arregla.
        const ok = groupName && teacherUsername
          ? (await homeOwnedBy(account.linux_username, teacherUsername, group.group_dir)) &&
            (await inGroup(account.linux_username, groupName))
          : true
        if (ok) continue
      }
      out.students += 1
      await prisma.linuxAccount.update({
        where: { user_id: account.user_id },
        data: { linux_provisioned: false },
      })
      await prisma.job.create({
        data: {
          type: "user_provisioning",
          priority: PRIORITIES.STUDENT,
          user_id: account.user_id,
          group_id: group.id,
          payload: {
            username: account.linux_username,
            group_dir: group.group_dir,
            group_name: groupName,
            teacher_username: teacherUsername,
          },
        },
      })
    } catch (err) {
      logger.error({ err, username: account.linux_username }, "Reconcile student failed")
    }
  }

  return { checked: teachers.length + admins.length + groups.length + enrollments.length, ...out }
}

async function reconcileGroup({ groupId }) {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { teacher: { include: { user: { include: { linuxAccount: true } } } } },
  })
  if (!group) {
    throw new AppError("Grupo no encontrado", 404, "NOT_FOUND")
  }
  if (group.status !== "active") {
    // El teardown de la finalizacion (y antes el del archivo) borro los
    // usuarios del entorno: re-aprovisionar los recrearia de la nada y sin
    // matricula activa no tiene sentido.
    return { checked: 0, orphaned: 0, requeued: 0 }
  }

  const groupName = groupNameOf(group)
  const teacherUsername = group.teacher?.user?.linuxAccount?.linux_username ?? null
  const out = { checked: 0, orphaned: 0, requeued: 0 }

  // El grupo Unix y el directorio deben existir (el docente puede no estar
  // provisionado aun: createGroup ya no depende de el).
  if (groupName && teacherUsername) {
    if (!(await groupExists(groupName))) {
      out.orphaned += 1
      out.requeued += 1
      await prisma.job.create({
        data: {
          type: "group_provisioning",
          priority: PRIORITIES.GROUP,
          group_id: group.id,
          payload: {
            group_dir: group.group_dir,
            group_name: groupName,
            teacher_username: teacherUsername,
          },
        },
      })
    }
  }

  const enrollments = await prisma.enrollment.findMany({
    where: { group_id: groupId },
    include: { student: { include: { user: { include: { linuxAccount: true } } } } },
  })

  for (const { student } of enrollments) {
    const account = student.user?.linuxAccount
    if (!account) continue
    out.checked += 1
    try {
      if (await userExists(account.linux_username)) {
        // La membresia se mira aparte del home: un estudiante creado antes de
        // que el aprovisionamiento la anadiera tiene el home correcto y sigue
        // fuera del grupo, y solo re-aprovisionando se arregla.
        const ok = groupName && teacherUsername
          ? (await homeOwnedBy(account.linux_username, teacherUsername, group.group_dir)) &&
            (await inGroup(account.linux_username, groupName))
          : true
        if (ok) continue
      }
      out.orphaned += 1
      out.requeued += 1
      await prisma.linuxAccount.update({
        where: { user_id: account.user_id },
        data: { linux_provisioned: false },
      })
      await prisma.job.create({
        data: {
          type: "user_provisioning",
          priority: PRIORITIES.STUDENT,
          user_id: account.user_id,
          group_id: group.id,
          payload: {
            username: account.linux_username,
            group_dir: group.group_dir,
            group_name: groupName,
            teacher_username: teacherUsername,
          },
        },
      })
    } catch (err) {
      logger.error({ err, username: account.linux_username }, "Reconcile check failed")
    }
  }

  return { checked: out.checked, orphaned: out.orphaned, requeued: out.requeued }
}

module.exports = { reconcileGroup, reconcileAll }
