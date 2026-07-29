const sshClient = require("./sshClient")
const prisma = require("../../prisma/client")

class ContainerServiceError extends Error {
  constructor(message, code) {
    super(message)
    this.name = "ContainerServiceError"
    this.code = code
  }
}

async function createUser(username) {
  const { code, stdout, stderr } = await sshClient.execCommand(
    `sudo id -u ${username} >/dev/null 2>&1 && exit 0 || sudo useradd -m -s /bin/bash ${username}`,
  )
  return { username, output: stdout || stderr || "" }
}

async function userExists(username) {
  const { code } = await sshClient.execCommand(`id -u ${username} >/dev/null 2>&1`)
  return code === 0
}

async function groupExists(groupName) {
  const { code } = await sshClient.execCommand(`getent group ${groupName} >/dev/null 2>&1`)
  return code === 0
}

async function createGroupDir(groupDir, groupName, teacherUsername) {
  const path = `/home/groups/${groupDir}`
  await sshClient.execCommand(`sudo mkdir -p ${path}`)
  const exists = await groupExists(groupName)
  if (!exists) {
    await sshClient.execCommand(`sudo groupadd ${groupName}`)
  }
  await sshClient.execCommand(`sudo usermod -aG ${groupName} ${teacherUsername}`)
  await sshClient.execCommand(`sudo chown ${teacherUsername}:${groupName} ${path}`)
  await sshClient.execCommand(`sudo chmod 2775 ${path}`)
}

async function provisionGroupDir(groupDir, groupName, teacherUsername) {
  await createGroupDir(groupDir, groupName, teacherUsername)
}

async function provisionLinuxAccount(linuxAccountId, username, groupDir, groupName) {
  const exists = await userExists(username)
  if (!exists) {
    if (groupDir && groupName) {
      const homePath = `/home/groups/${groupDir}/${username}`
      await sshClient.execCommand(`sudo useradd -m -d ${homePath} -s /bin/bash ${username}`)
      await sshClient.execCommand(`sudo chgrp ${groupName} ${homePath}`)
      await sshClient.execCommand(`sudo chmod 2770 ${homePath}`)
    } else {
      await createUser(username)
    }
  }
  await prisma.linuxAccount.update({
    where: { user_id: linuxAccountId },
    data: { linux_provisioned: true },
  })
}

async function openPtySession(username) {
  const stream = await sshClient.createShellStream()
  stream.write(`sudo su - ${username}\n`)
  return stream
}

function closePtySession(stream) {
  if (stream && typeof stream.destroy === "function") {
    stream.destroy()
  }
}

module.exports = {
  createUser,
  userExists,
  groupExists,
  createGroupDir,
  provisionGroupDir,
  openPtySession,
  closePtySession,
  provisionLinuxAccount,
  ContainerServiceError,
}
