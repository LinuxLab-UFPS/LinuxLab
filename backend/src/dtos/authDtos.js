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

const registerSelfStudentSchema = z.object({
  email: emailField,
  name: z.string().trim().min(1, "Ingresa tu nombre completo").max(255),
  code: z
    .string()
    .trim()
    .min(1, "Ingresa tu código de estudiante")
    .max(20, "El código no puede superar los 20 caracteres"),
})

const setStudentCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Ingresa tu código de estudiante")
    .max(20, "El código no puede superar los 20 caracteres"),
})

module.exports = { idTokenSchema, requestEmailSchema, registerSelfStudentSchema, setStudentCodeSchema }
