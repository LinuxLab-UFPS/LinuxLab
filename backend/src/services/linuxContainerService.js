const sshClient = require("./sshClient")
const prisma = require("../../prisma/client")
const logger = require("../lib/logger")

const ACCOUNT_STORE = "/var/lib/linuxlab"

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

async function createGroup(teacherUsername, groupDir, groupName) {
  const path = `/home/${teacherUsername}/grupos/${groupDir}`
  try {
    if (!(await groupExists(groupName))) {
      await execChecked(`sudo groupadd ${groupName}`, `groupadd(${groupName})`)
    }
    await execChecked(
      `sudo usermod -aG ${groupName} ${teacherUsername} && ` +
      `sudo mkdir -p ${path} && ` +
      `sudo chown ${teacherUsername}:${groupName} ${path} && ` +
      `sudo chmod 2751 ${path}`,
      `createGroup(${groupName})`,
    )
  } finally {
    await snapshotAccounts()
  }
}

async function createStudent(teacherUsername, groupDir, groupName, studentUsername) {
  const home = `/home/${teacherUsername}/grupos/${groupDir}/${studentUsername}`
  try {
    await execChecked(
      `sudo mkdir -p ${home} && ` +
      `sudo useradd -M -d ${home} -s /bin/bash ${studentUsername} && ` +
      `sudo chown ${studentUsername}:${groupName} ${home} && ` +
      `sudo chmod 2750 ${home}`,
      `createStudent(${studentUsername})`,
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

async function provisionTeacherAccount(linuxAccountId, username) {
  if (!await userExists(username)) {
    await createTeacher(username)
  }
  if (!(await userExists(username))) {
    throw new Error(`Verification failed: user ${username} does not exist after provisioning`)
  }
  await prisma.linuxAccount.update({
    where: { user_id: linuxAccountId },
    data: { linux_provisioned: true },
  })
}

async function provisionStudentAccount(linuxAccountId, username, teacherUsername, groupDir, groupName) {
  if (!await userExists(username)) {
    await createStudent(teacherUsername, groupDir, groupName, username)
  }
  if (!(await userExists(username))) {
    throw new Error(`Verification failed: user ${username} does not exist after provisioning`)
  }
  await prisma.linuxAccount.update({
    where: { user_id: linuxAccountId },
    data: { linux_provisioned: true },
  })
}

async function openPtySession(username) {
  return sshClient.createExecStream(`sudo su - ${username}`)
}

function closePtySession(stream) {
  if (stream && typeof stream.destroy === "function") {
    stream.destroy()
  }
}

module.exports = {
  userExists,
  groupExists,
  createTeacher,
  createGroup,
  createStudent,
  teardownGroup,
  provisionTeacherAccount,
  provisionStudentAccount,
  openPtySession,
  closePtySession,
}
