const { sanitizeUsername } = require("./sanitizeUsername")

function uniqueUsername(base, taken) {
  let username = base
  let suffix = 2
  while (taken.has(username)) {
    username = `${base.substring(0, 32 - String(suffix).length - 1)}_${suffix}`
    suffix += 1
  }
  taken.add(username)
  return username
}

async function createLinuxAccountWithUniqueUsername(db, userId, email) {
  const base = sanitizeUsername(email)
  const taken = new Set()
  for (;;) {
    const username = uniqueUsername(base, taken)
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
    }
  }
}

async function createLinuxAccountsUnique(db, users) {
  const rows = users.map((user) => ({ user, base: sanitizeUsername(user.email) }))
  const taken = new Set(
    (await db.linuxAccount.findMany({
      where: { linux_username: { in: rows.map((row) => row.base) } },
      select: { linux_username: true },
    })).map((account) => account.linux_username),
  )

  const data = rows.map(({ user, base }) => ({
    user_id: user.id,
    linux_username: uniqueUsername(base, taken),
    linux_provisioned: false,
  }))

  try {
    await db.linuxAccount.createMany({ data })
  } catch (err) {
    if (err?.code !== "P2002") throw err
    for (const row of data) {
      try {
        await db.linuxAccount.create({ data: row })
      } catch (retryErr) {
        if (retryErr?.code !== "P2002") throw retryErr
        throw new Error(
          `No se pudo asignar un username único a ${row.linux_username} (colisión concurrente)`,
        )
      }
    }
  }
}

module.exports = { createLinuxAccountWithUniqueUsername, createLinuxAccountsUnique }
