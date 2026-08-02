const { sanitizeUsername } = require("./sanitizeUsername")

async function createLinuxAccountWithUniqueUsername(db, userId, email) {
  const base = sanitizeUsername(email)
  let username = base
  let suffix = 2
  for (;;) {
    try {
      await db.linuxAccount.create({
        data: {
          user_id: userId,
          linux_username: username,
          linux_provisioned: false,
        },
      })
      return username
    } catch (err) {
      if (err?.code !== "P2002") throw err
      username = `${base.substring(0, 32 - String(suffix).length - 1)}_${suffix}`
      suffix += 1
    }
  }
}

module.exports = { createLinuxAccountWithUniqueUsername }
