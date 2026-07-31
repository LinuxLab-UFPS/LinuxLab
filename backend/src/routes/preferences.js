const express = require("express")
const prisma = require("../../prisma/client")
const authMiddleware = require("../middleware/auth")
const logger = require("../lib/logger")

const router = express.Router()

router.put("/", authMiddleware, async (req, res) => {
  try {
    const { terminalFontSize, terminalFontFamily, theme } = req.body

    const data = {}
    if (terminalFontSize !== undefined) data.terminal_font_size = terminalFontSize
    if (terminalFontFamily !== undefined) data.terminal_font_family = terminalFontFamily
    if (theme !== undefined) data.theme = theme

    const prefs = await prisma.userPreference.upsert({
      where: { user_id: req.user.id },
      update: data,
      create: {
        user_id: req.user.id,
        ...data,
      },
    })

    res.json({
      terminalFontSize: prefs.terminal_font_size,
      terminalFontFamily: prefs.terminal_font_family,
      theme: prefs.theme,
    })
  } catch (error) {
    logger.error({ err: error }, "Error updating preferences")
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

module.exports = router
