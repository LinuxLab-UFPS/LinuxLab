const { z } = require("zod")

const TERMINAL_FONT_FAMILIES = [
  "Menlo, Monaco, 'Courier New', monospace",
  "'Fira Code', 'Cascadia Code', monospace",
  "'JetBrains Mono', monospace",
  "'Source Code Pro', monospace",
  "monospace",
] // Con las que ofrece terminal-settings-bar en el frontend.

const preferencesSchema = z.object({
  terminalFontSize: z
    .number()
    .int()
    .min(12, "El tamaño de la letra debe estar entre 12 y 24 px")
    .max(24, "El tamaño de la letra debe estar entre 12 y 24 px")
    .optional(),
  terminalFontFamily: z
    .enum(TERMINAL_FONT_FAMILIES, { errorMap: () => ({ message: "La familia tipográfica no es válida" }) })
    .optional(),
  theme: z
    .enum(["system", "light", "dark"], { errorMap: () => ({ message: "El tema no es válido" }) })
    .optional(),
})

module.exports = { preferencesSchema, TERMINAL_FONT_FAMILIES }
