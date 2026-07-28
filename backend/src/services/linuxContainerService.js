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
    `id -u ${username} >/dev/null 2>&1 && exit 0 || useradd -m -s /bin/bash ${username}`,
  )
  return { username, output: stdout || stderr || "" }
}

async function userExists(username) {
  const { code } = await sshClient.execCommand(`id -u ${username} >/dev/null 2>&1`)
  return code === 0
}

async function openPtySession(username) {
  const stream = await sshClient.createShellStream()
  stream.write(`su - ${username}\n`)
  return stream
}

function closePtySession(stream) {
  if (stream && typeof stream.destroy === "function") {
    stream.destroy()
  }
}

async function provisionLinuxAccount(linuxAccountId, username) {
  const exists = await userExists(username)
  if (!exists) {
    await createUser(username)
  }
  await prisma.linuxAccount.update({
    where: { user_id: linuxAccountId },
    data: { linux_provisioned: true },
  })
}

module.exports = {
  createUser,
  userExists,
  openPtySession,
  closePtySession,
  provisionLinuxAccount,
  ContainerServiceError,
}
