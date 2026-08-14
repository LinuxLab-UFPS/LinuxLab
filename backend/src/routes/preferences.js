const express = require("express")
const prisma = require("../../prisma/client")
const authMiddleware = require("../middleware/auth")
const { preferencesSchema } = require("../dtos/preferenceDtos")
const { parseOrThrow } = require("../dtos/common")

const router = express.Router()

router.put("/", authMiddleware, async (req, res) => {
  const parsed = parseOrThrow(preferencesSchema, req.body ?? {})

  const data = {}
  if (parsed.terminalFontSize !== undefined) data.terminal_font_size = parsed.terminalFontSize
  if (parsed.terminalFontFamily !== undefined) data.terminal_font_family = parsed.terminalFontFamily
  if (parsed.theme !== undefined) data.theme = parsed.theme

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
})

module.exports = router
