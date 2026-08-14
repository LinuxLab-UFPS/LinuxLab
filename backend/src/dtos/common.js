const { z } = require("zod")
const { ValidationError } = require("../lib/errors")
const { EMAIL_REGEX } = require("../lib/constants")

/**
 * Valida `data` contra un schema zod y traduce el primer error a un
 * ValidationError (400 VALIDATION_ERROR) con mensaje en español.
 */
function parseOrThrow(schema, data) {
  const result = schema.safeParse(data)
  if (!result.success) {
    const first = result.error.issues[0]
    const message = first?.message || "Datos inválidos"
    throw new ValidationError(message)
  }
  return result.data
}

/** Correo obligatorio, normalizado a minusculas, con el mismo formato historico. */
const emailField = z
  .string({
    required_error: "El correo electrónico es requerido",
    invalid_type_error: "El correo electrónico es requerido",
  })
  .trim()
  .toLowerCase()
  .regex(EMAIL_REGEX, "El formato del correo electrónico no es válido")

module.exports = { parseOrThrow, emailField }
