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
  code: z
    .string({
      required_error: "El código del docente es requerido",
      invalid_type_error: "El código del docente es requerido",
    })
    .trim()
    .min(1, "El código del docente es requerido")
    .max(20, "El código del docente no puede exceder 20 caracteres"),
})

/** Forma de usuario que viaja en /api/auth/firebase y /api/auth/me. */
function serializeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    code: user.student?.code ?? user.teacher?.code ?? null,
    googleId: user.google_id,
    active: user.active,
    linuxUsername: user.linuxAccount?.linux_username ?? null,
    linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
    settings: user.settings
      ? {
          terminalFontSize: user.settings.terminal_font_size,
          terminalFontFamily: user.settings.terminal_font_family,
          theme: user.settings.theme,
        }
      : null,
  }
}

function serializeTeacher(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    code: user.teacher?.code ?? null,
    active: user.active,
    linuxUsername: user.linuxAccount?.linux_username ?? null,
    linuxProvisioned: user.linuxAccount?.linux_provisioned ?? false,
  }
}

module.exports = { registerTeacherSchema, serializeUser, serializeTeacher }
