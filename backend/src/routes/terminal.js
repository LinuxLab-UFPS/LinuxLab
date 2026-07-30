const express = require("express")
const prisma = require("../../prisma/client")
const authMiddleware = require("../middleware/auth")
const sshClient = require("../services/sshClient")
const logger = require("../lib/logger")

const router = express.Router()

router.post("/reset", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { linuxAccount: true },
    })

    if (!user?.linuxAccount?.linux_username) {
      return res.status(400).json({ error: "No linux account configured" })
    }

    const username = user.linuxAccount.linux_username

    await sshClient.execCommand(`sudo su -c "pkill -u ${username}" 2>/dev/null || true`)

    logger.info({ username }, "Terminal reset")
    res.json({ ok: true })
  } catch (error) {
    logger.error({ err: error }, "Terminal reset error")
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

module.exports = router
