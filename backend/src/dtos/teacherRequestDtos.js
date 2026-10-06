const { z } = require("zod")
const { emailField } = require("./common")

// Mismas reglas que el registro de docentes del admin (userDtos), para que una
// solicitud aprobada nunca choque con la validacion del registro.
const createTeacherRequestSchema = z.object({
  name: z
    .string({
      required_error: "El nombre es requerido",
      invalid_type_error: "El nombre es requerido",
    })
    .trim()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede superar los 255 caracteres"),
  email: emailField,
  code: z
    .string({
      required_error: "El código docente es requerido",
      invalid_type_error: "El código docente es requerido",
    })
    .trim()
    .min(1, "El código docente es requerido")
    .max(8, "El código docente no puede exceder 8 caracteres"),
  department: z.string().trim().max(255, "La dependencia no puede superar los 255 caracteres").optional().nullable(),
  message: z.string().trim().max(1000, "El mensaje no puede superar los 1000 caracteres").optional().nullable(),
})

function serializeTeacherRequest(request) {
  return {
    id: request.id,
    name: request.name,
    email: request.email,
    code: request.code,
    department: request.department ?? null,
    message: request.message ?? null,
    status: request.status,
    createdAt: request.created_at,
    reviewedAt: request.reviewed_at ?? null,
  }
}

module.exports = { createTeacherRequestSchema, serializeTeacherRequest }
