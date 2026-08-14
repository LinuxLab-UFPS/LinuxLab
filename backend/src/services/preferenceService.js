const prisma = require("../../prisma/client")
const { preferencesSchema } = require("../dtos/preferenceDtos")
const { parseOrThrow } = require("../dtos/common")

/** Aplica las preferencias enviadas (solo las que vienen) y devuelve las vigentes. */
async function update(userId, body) {
  const parsed = parseOrThrow(preferencesSchema, body ?? {})

  const data = {}
  if (parsed.terminalFontSize !== undefined) data.terminal_font_size = parsed.terminalFontSize
  if (parsed.terminalFontFamily !== undefined) data.terminal_font_family = parsed.terminalFontFamily
  if (parsed.theme !== undefined) data.theme = parsed.theme

  const prefs = await prisma.userPreference.upsert({
    where: { user_id: userId },
    update: data,
    create: {
      user_id: userId,
      ...data,
    },
  })

  return {
    terminalFontSize: prefs.terminal_font_size,
    terminalFontFamily: prefs.terminal_font_family,
    theme: prefs.theme,
  }
}

module.exports = { update }
