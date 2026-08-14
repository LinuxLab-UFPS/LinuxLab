const { z } = require("zod")

const idTokenSchema = z.object({
  idToken: z
    .string({
      required_error: "Se requiere el token de acceso",
      invalid_type_error: "Se requiere el token de acceso",
    })
    .min(1, "Se requiere el token de acceso"),
})

module.exports = { idTokenSchema }
