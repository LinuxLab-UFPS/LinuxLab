const { z } = require("zod")
const { emailField } = require("./common")

const idTokenSchema = z.object({
  idToken: z
    .string({
      required_error: "Se requiere el token de acceso",
      invalid_type_error: "Se requiere el token de acceso",
    })
    .min(1, "Se requiere el token de acceso"),
})

const requestEmailSchema = z.object({
  email: emailField,
})

module.exports = { idTokenSchema, requestEmailSchema }
