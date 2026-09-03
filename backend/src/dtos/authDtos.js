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
  /* El formulario de "Completar información" envía también el nombre: quien
     entra por Gmail llega con el de su cuenta de Google y puede corregirlo
     aquí antes de usar la plataforma. Opcional para no romper a quien solo
     manda el código. */
  name: z
    .string()
    .trim()
    .min(1, "Ingresa tu nombre completo")
    .max(255)
    .optional(),
})

module.exports = { idTokenSchema, requestEmailSchema, registerSelfStudentSchema, setStudentCodeSchema }
