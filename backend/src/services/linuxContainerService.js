const sshClient = require("./sshClient")
const prisma = require("../../prisma/client")

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
  await execChecked(
    `sudo useradd -M -d ${home} -s /bin/bash ${teacherUsername} && ` +
    `sudo mkdir -p ${home} ${root}/grupos && ` +
    `sudo chown ${teacherUsername}:${teacherUsername} ${root} ${root}/grupos ${home} && ` +
    `sudo chmod 751 ${root} ${root}/grupos && ` +
    `sudo chmod 750 ${home}`,
    `createTeacher(${teacherUsername})`,
  )
}

async function createGroup(teacherUsername, groupDir, groupName) {
  const path = `/home/${teacherUsername}/grupos/${groupDir}`
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
}

async function createStudent(teacherUsername, groupDir, groupName, studentUsername) {
  const home = `/home/${teacherUsername}/grupos/${groupDir}/${studentUsername}`
  await execChecked(
    `sudo mkdir -p ${home} && ` +
    `sudo useradd -M -d ${home} -s /bin/bash ${studentUsername} && ` +
    `sudo chown ${studentUsername}:${groupName} ${home} && ` +
    `sudo chmod 2750 ${home}`,
    `createStudent(${studentUsername})`,
  )
}

async function archiveGroup(teacherUsername, groupDir, groupName) {
  const path = `/home/${teacherUsername}/grupos/${groupDir}`
  const { stdout } = await sshClient.execCommand(`ls ${path}/ 2>/dev/null || true`)
  for (const student of stdout.split("\n").filter(Boolean)) {
    await sshClient.execCommand(`sudo userdel ${student} 2>/dev/null || true`)
  }
  await sshClient.execCommand(
    `sudo groupdel ${groupName} 2>/dev/null; sudo rm -rf ${path}`,
  )
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
  archiveGroup,
  provisionTeacherAccount,
  provisionStudentAccount,
  openPtySession,
  closePtySession,
}
