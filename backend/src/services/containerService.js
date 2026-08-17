const sshClient = require("./sshService")
const prisma = require("../../prisma/client")
const logger = require("../lib/logger")
const { AppError } = require("../lib/errors")

const ACCOUNT_STORE = "/var/lib/linuxlab"

//: Cuota de disco por estudiante (KB) y techo de CPU por cgroup (10% de 1 CPU).
const QUOTA_KB = 20480
const CPU_MAX = "10000 100000"

let snapshotQueue = Promise.resolve()

async function snapshotAccounts() {
  snapshotQueue = snapshotQueue.catch(() => {}).then(async () => {
    const { code, stderr } = await sshClient.execCommand(
      `sudo cp -p /etc/passwd /etc/group /etc/shadow /etc/gshadow ${ACCOUNT_STORE}/`,
    )
    if (code !== 0) {
      logger.warn({ stderr, code }, "Account snapshot to volume failed")
    }
  })
  return snapshotQueue
}

async function userExists(username) {
  const { code } = await sshClient.execCommand(`id -u ${username} >/dev/null 2>&1`)
  return code === 0
}

async function groupExists(groupName) {
  const { code } = await sshClient.execCommand(`getent group ${groupName} >/dev/null 2>&1`)
  return code === 0
}

async function execChecked(command, description) {
  const result = await sshClient.execCommand(command)
  if (result.code !== 0) {
    throw new Error(`${description}: ${result.stderr || `exit code ${result.code}`}`)
  }
  return result
}

/** True si el home del estudiante le pertenece (uid coincide). */
async function homeOwnedBy(username, teacherUsername, groupDir) {
  const home = `/home/${teacherUsername}/grupos/${groupDir}/${username}`
  const { code, stdout } = await sshClient.execCommand(`stat -c %u ${home} 2>/dev/null`)
  if (code !== 0) return false
  const idRes = await sshClient.execCommand(`id -u ${username} 2>/dev/null`)
  if (idRes.code !== 0) return false
  return stdout.trim() === idRes.stdout.trim()
}

async function createTeacher(teacherUsername) {
  const root = `/home/${teacherUsername}`
  const home = `${root}/home`
  try {
    await execChecked(
      `sudo useradd -M -d ${home} -s /bin/bash ${teacherUsername} && ` +
      `sudo mkdir -p ${home} ${root}/grupos && ` +
      `sudo chown ${teacherUsername}:${teacherUsername} ${root} ${root}/grupos ${home} && ` +
      `sudo chmod 751 ${root} ${root}/grupos && ` +
      `sudo chmod 750 ${home}`,
      `createTeacher(${teacherUsername})`,
    )
  } finally {
    await snapshotAccounts()
  }
}

/**
 * El docente se hace dueno de los directorios de sus grupos activos y se une
 * al grupo Unix de cada uno. Reparacion idempotente: los directorios creados
 * por `createGroup` ya nacen del docente, esto corrige los que quedaron con
 * ownership viejo (root:grp) de antes o tras reprovisionar la cuenta.
 */
async function syncTeacherGroups(teacherUsername) {
  const account = await prisma.linuxAccount.findUnique({
    where: { linux_username: teacherUsername },
    select: { user_id: true },
  })
  if (!account) return

  const groups = await prisma.group.findMany({
    where: { teacher_id: account.user_id, archived: false, group_dir: { not: null } },
    select: { id: true, group_dir: true },
  })

  for (const group of groups) {
    const groupName = groupNameOf(group.id)
    const path = `/home/${teacherUsername}/grupos/${group.group_dir}`
    await sshClient.execCommand(
      `sudo usermod -aG ${groupName} ${teacherUsername} 2>/dev/null; ` +
      `sudo chown ${teacherUsername}:${groupName} ${path} 2>/dev/null || true`,
    )
  }
  logger.info({ teacherUsername, groups: groups.length }, "Teacher synced to group directories")
}

/**
 * Crea el directorio del grupo y el grupo Unix. El directorio nace directo del
 * docente (el worker garantiza que su cuenta existe antes del job de grupo):
 * es dueno y queda en el grupo Unix para poder leer el trabajo de sus
 * estudiantes. Idempotente: los comandos son seguros de repetir.
 */
async function createGroup(teacherUsername, groupDir, groupName) {
  const path = `/home/${teacherUsername}/grupos/${groupDir}`
  try {
    if (!(await groupExists(groupName))) {
      await execChecked(`sudo groupadd ${groupName}`, `groupadd(${groupName})`)
    }
    await execChecked(
      `sudo mkdir -p ${path} && ` +
      `sudo chown ${teacherUsername}:${groupName} ${path} && ` +
      `sudo chmod 2751 ${path} && ` +
      `sudo usermod -aG ${groupName} ${teacherUsername}`,
      `createGroup(${groupName})`,
    )
  } finally {
    await snapshotAccounts()
  }
}

/**
 * Crea el estudiante y su home dentro del directorio del grupo. Es
 * idempotente: si el usuario ya existe (intento previo fallido a mitad),
 * repara permisos y re-aplica el endurecimiento (cuota de disco y cgroup).
 *
 * Si el chown falla no se deja un home root:root colgado: el directorio vacio
 * se borra y el worker reintenta en el siguiente ciclo.
 */
async function createStudent(teacherUsername, groupDir, groupName, studentUsername) {
  const home = `/home/${teacherUsername}/grupos/${groupDir}/${studentUsername}`
  try {
    if (!(await groupExists(groupName))) {
      throw new Error(
        `El grupo Unix ${groupName} no existe: el job del grupo debe correr antes que este`,
      )
    }
    try {
      await execChecked(
        `sudo mkdir -p ${home} && ` +
        `(sudo useradd -M -d ${home} -s /bin/bash ${studentUsername} 2>/dev/null || true) && ` +
        `sudo chown ${studentUsername}:${groupName} ${home} && ` +
        `sudo chmod 2750 ${home}`,
        `createStudent(${studentUsername})`,
      )
    } catch (err) {
      await sshClient.execCommand(`sudo rmdir ${home} 2>/dev/null || true`)
      throw err
    }
    // Endurecimiento (gracioso: si el host no lo soporta, no rompe nada):
    // cuota de disco de 20 MB y cgroup de CPU al 10% por estudiante.
    await sshClient.execCommand(
      `sudo sh -c 'mkdir -p /sys/fs/cgroup/linuxlab/${studentUsername} 2>/dev/null; ` +
      `echo ${CPU_MAX} > /sys/fs/cgroup/linuxlab/${studentUsername}/cpu.max 2>/dev/null; ` +
      `setquota -u ${studentUsername} 0 ${QUOTA_KB} 0 0 /home 2>/dev/null; true'`,
    )
  } finally {
    await snapshotAccounts()
  }
}

/**
 * Elimina del entorno lo que queda de un grupo archivado: los usuarios Linux
 * de los matriculados (los usernames vienen de la BD, nunca de listar el
 * directorio) y luego el grupo Unix y la carpeta, que se borra recursivamente
 * por su ruta construida con el group_dir de la BD.
 */
async function teardownGroup({ teacherUsername, groupDir, groupName, usernames }) {
  const path = `/home/${teacherUsername}/grupos/${groupDir}`
  try {
    for (const username of usernames || []) {
      await sshClient.execCommand(`sudo userdel ${username} 2>/dev/null || true`)
    }
    await sshClient.execCommand(
      `sudo groupdel ${groupName} 2>/dev/null; sudo rm -rf ${path}`,
    )
  } finally {
    await snapshotAccounts()
  }
}

/**
 * Repara la ownership del directorio de un grupo (idempotente): debe ser del
 * docente, que ademas queda en el grupo Unix para poder leer el trabajo de sus
 * estudiantes. Usado por el reconcile para corregir directorios que nacieron
 * como root:grp cuando el docente no estaba provisionado aun.
 */
async function repairGroupOwnership(teacherUsername, groupDir, groupName) {
  const path = `/home/${teacherUsername}/grupos/${groupDir}`
  await sshClient.execCommand(
    `sudo usermod -aG ${groupName} ${teacherUsername} 2>/dev/null; ` +
    `sudo chown ${teacherUsername}:${groupName} ${path} 2>/dev/null || true`,
  )
}

async function provisionTeacherAccount(linuxAccountId, username) {
  if (!await userExists(username)) {
    await createTeacher(username)
  }
  if (!(await userExists(username))) {
    throw new Error(`Verification failed: user ${username} does not exist after provisioning`)
  }
  await syncTeacherGroups(username)
  await prisma.linuxAccount.update({
    where: { user_id: linuxAccountId },
    data: { linux_provisioned: true },
  })
}

async function provisionStudentAccount(linuxAccountId, username, teacherUsername, groupDir, groupName) {
  // createStudent es idempotente: tambien repara el caso de un intento previo
  // que dejo al usuario creado con el home roto.
  await createStudent(teacherUsername, groupDir, groupName, username)
  if (!(await homeOwnedBy(username, teacherUsername, groupDir))) {
    throw new Error(`Verification failed: home of ${username} is not owned by the user`)
  }
  await prisma.linuxAccount.update({
    where: { user_id: linuxAccountId },
    data: { linux_provisioned: true },
  })
}

/**
 * Abre la sesion interactiva del estudiante. Corre a prioridad baja (nice 10)
 * y, si el cgroup per-user existe, mueve el shell ahi (techo de CPU al 10%).
 * Sin cgroup (docente, o host sin soporte), el nice + el cpus del compose lo
 * protegen.
 *
 * El write al cgroup va guardado con `[ -d ]`: si el directorio no existe, el
 * fallo de la redireccion lo reportaria el propio sh a la terminal (no se
 * suprime con 2>/dev/null). El guard evita el mensaje.
 */
async function openPtySession(username) {
  return sshClient.createExecStream(
    `sudo sh -c 'if [ -d /sys/fs/cgroup/linuxlab/${username} ]; then ` +
    `echo $$ > /sys/fs/cgroup/linuxlab/${username}/cgroup.procs 2>/dev/null; fi; ` +
    `exec nice -n 10 su - ${username}'`,
  )
}

/**
 * Mata los procesos del usuario en el entorno: es lo que hay detrás de
 * "Reset terminal". El pkill corre con sudo y el fallo se ignora (si el
 * usuario no tiene procesos vivos, no hay nada que hacer).
 */
async function resetTerminal(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { linuxAccount: true },
  })

  if (!user?.linuxAccount?.linux_username) {
    throw new AppError("No tienes cuenta Linux configurada", 400, "VALIDATION_ERROR")
  }

  const username = user.linuxAccount.linux_username
  if (!/^[a-z_][a-z0-9_-]{0,31}$/.test(username)) {
    throw new AppError("El nombre de tu cuenta no es válido", 500, "INTERNAL_ERROR")
  }

  // `pkill` señala y vuelve: no espera a que los procesos mueran. La interfaz
  // reabre la terminal en cuanto responde esta llamada, asi que la sesion nueva
  // entraba mientras la vieja seguia agonizando y a veces caia en el mismo
  // barrido. De ahi que recargar la pagina funcionara —tarda lo suyo— y el
  // boton no.
  //
  // Aqui se espera a que no quede ninguno, con un KILL para los que se resistan,
  // de modo que cuando esto responde la cuenta esta limpia de verdad.
  await sshClient.execCommand(
    `sudo su -c 'pkill -u ${username};` +
    ` for i in 1 2 3 4 5 6 7 8 9 10; do pgrep -u ${username} >/dev/null || break; sleep 0.2; done;` +
    ` pkill -KILL -u ${username} 2>/dev/null; true' 2>/dev/null || true`,
  )

  logger.info({ username }, "Terminal reset")
  return { ok: true }
}

module.exports = {
  userExists,
  groupExists,
  homeOwnedBy,
  createTeacher,
  syncTeacherGroups,
  repairGroupOwnership,
  createGroup,
  createStudent,
  teardownGroup,
  provisionTeacherAccount,
  provisionStudentAccount,
  openPtySession,
  resetTerminal,
}
