const { z } = require("zod")
const { emailField } = require("./common")

const registerTeacherSchema = z.object({
  name: z
    .string({
      required_error: "El nombre del docente es requerido",
      invalid_type_error: "El nombre del docente es requerido",
    })
    .trim()
    .min(1, "El nombre del docente es requerido"),
  email: emailField,
})

/** Forma de usuario que viaja en /api/auth/firebase y /api/auth/me. */
function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    code: user.studentProfile?.code ?? null,
    googleId: user.google_id,
    active: user.active,
    linuxUsername: user.linuxAccount?.linux_username ?? null,
    linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
    preferences: user.preferences
      ? {
          terminalFontSize: user.preferences.terminal_font_size,
          terminalFontFamily: user.preferences.terminal_font_family,
          theme: user.preferences.theme,
        }
      : null,
  }
}

function serializeTeacher(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: user.active,
    linuxUsername: user.linuxAccount?.linux_username ?? null,
    linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
  }
}

module.exports = { registerTeacherSchema, serializeUser, serializeTeacher }
