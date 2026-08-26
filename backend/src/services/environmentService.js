const prisma = require("../../prisma/client")
const sshClient = require("./sshService")
const { Role } = require("@prisma/client")
const { sanitizeUsername } = require("../utils/sanitizeUsername")
const { groupNameOf } = require("../utils/groupName")
const { PRIORITIES } = require("../lib/constants")

/** Cuentas del sistema dentro del contenedor, sin las de servicio. */
async function containerUsers() {
  const { stdout } = await sshClient.execCommand(
    `getent passwd | awk -F: '$3>=1000 && $3<65534 {print $1}'`,
  )
  return stdout.split("\n").map((line) => line.trim()).filter(Boolean)
}

async function containerGroups() {
  const { stdout } = await sshClient.execCommand(
    `getent group | awk -F: '$1 ~ /^grp_/ {print $1}'`,
  )
  return stdout.split("\n").map((line) => line.trim()).filter(Boolean)
}

async function dirExists(path) {
  const { code } = await sshClient.execCommand(`test -d "${path}"`)
  return code === 0
}

/**
 * Lo que dice la base contra lo que hay en el contenedor: cuentas que faltan,
 * cuentas sobrantes, cursos sin su grupo o sin su carpeta, y trabajos atascados.
 * Es solo lectura; arreglar es otra llamada.
 */
async function snapshot() {
  const [accounts, groups, users, unixGroups] = await Promise.all([
    prisma.linuxAccount.findMany({
      select: {
        linux_username: true,
        linux_provisioned: true,
        user: { select: { name: true, email: true, role: true } },
      },
    }),
    prisma.group.findMany({
      where: { status: "active" },
      select: {
        id: true,
        name: true,
        group_dir: true,
        teacher: { select: { user: { select: { linuxAccount: { select: { linux_username: true } } } } } },
      },
    }),
    containerUsers(),
    containerGroups(),
  ])

  const inContainer = new Set(users)
  const known = new Set(accounts.map((a) => a.linux_username))

  const missing = accounts
    .filter((a) => !inContainer.has(a.linux_username))
    .map((a) => ({
      username: a.linux_username,
      name: a.user.name,
      email: a.user.email,
      role: a.user.role,
    }))

  // labadmin es la cuenta de operacion del backend, no sobra.
  const orphans = users.filter((u) => u !== "labadmin" && !known.has(u))

  const courses = []
  for (const group of groups) {
    const groupName = groupNameOf(group.id)
    const teacher = group.teacher.linuxAccount?.linux_username ?? null
    const path = teacher && group.group_dir
      ? `/home/${teacher}/grupos/${group.group_dir}`
      : null
    courses.push({
      id: group.id,
      name: group.name,
      groupName,
      teacher,
      hasUnixGroup: unixGroups.includes(groupName),
      hasDir: path ? await dirExists(path) : false,
    })
  }

  const jobCounts = await prisma.job.groupBy({
    by: ["type", "status"],
    _count: true,
  })

  const countsByType = {}
  for (const row of jobCounts) {
    countsByType[row.type] = countsByType[row.type] || {}
    countsByType[row.type][row.status] = row._count
  }

  return {
    accounts: {
      inDatabase: accounts.length,
      inContainer: users.length,
      missing,
      orphans,
    },
    courses,
    jobs: {
      users: countsByType["user_provisioning"] || {},
      groups: countsByType["group_provisioning"] || {},
      teardown: countsByType["group_teardown"] || {},
    },
  }
}

/** Devuelve a "pendiente" los trabajos que agotaron sus reintentos. */
async function requeueFailed() {
  const result = await prisma.job.updateMany({
    where: { status: "failed" },
    data: { status: "pending", retries: 0, error: null },
  })
  return { total: result.count }
}

/**
 * La cuenta del propio admin dentro del entorno. Es una cuenta normal, sin sudo
 * ni acceso a los directorios de los cursos: sirve para usar el laboratorio, no
 * para administrarlo. Administrar se hace por estas mismas rutas.
 */
async function ensureOwnAccount(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { linuxAccount: true },
  })
  if (!user || user.role !== Role.admin) {
    return { created: false, username: user?.linuxAccount?.linux_username ?? null }
  }
  if (user.linuxAccount) {
    return { created: false, username: user.linuxAccount.linux_username }
  }

  const username = sanitizeUsername(user.email)
  await prisma.linuxAccount.create({
    data: { user_id: user.id, linux_username: username, linux_provisioned: false },
  })
  await prisma.job.create({
    data: {
      type: "user_provisioning",
      priority: PRIORITIES.TEACHER,
      user_id: user.id,
      payload: { username },
    },
  })
  return { created: true, username }
}

module.exports = { snapshot, requeueFailed, ensureOwnAccount }
