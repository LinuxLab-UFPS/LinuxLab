const { z } = require("zod")
const { emailField } = require("./common")

const studentRowSchema = z.object({
  name: z
    .string({ invalid_type_error: "El nombre del estudiante debe ser texto" })
    .trim()
    .max(255)
    .optional(),
  email: z
    .string({ invalid_type_error: "El correo del estudiante debe ser texto" })
    .trim()
    .toLowerCase()
    .optional(),
  code: z
    .string({ invalid_type_error: "El código del estudiante debe ser texto" })
    .trim()
    .max(20, "El código no puede superar los 20 caracteres")
    .optional()
    .nullable(),
})

const createGroupSchema = z.object({
  name: z
    .string({
      required_error: "El nombre del grupo es requerido",
      invalid_type_error: "El nombre del grupo es requerido",
    })
    .trim()
    .min(1, "El nombre del grupo es requerido")
    .max(255, "El nombre del grupo no puede superar los 255 caracteres"),
  description: z.string().trim().max(2000).optional().nullable(),
  // Las filas se validan a mano en la matricula (por fila, sin tumbar todo el
  // lote): aqui solo se exige que la forma sea la esperada.
  students: z.array(studentRowSchema).max(500, "No se pueden matricular más de 500 estudiantes a la vez").default([]),
})

const registerStudentSchema = z.object({
  name: z.string().trim().max(255).optional().default(""),
  email: emailField,
  code: z.string().trim().max(20, "El código no puede superar los 20 caracteres").optional().nullable(),
})

/**
 * Cuenta las actividades que propone un grupo.
 *
 * Suma las del temario, que todo grupo trae por el simple hecho de existir. Sin
 * ellas un curso recien creado decia "0 actividades" cuando en realidad ya
 * ofrecia las del curso completo, y el docente no tenia forma de saberlo.
 *
 * El total del temario lo inyecta quien llama (una sola consulta por peticion,
 * no una por grupo cuando se listan varios).
 */
function serializeGroup(group, studentCount, activityCount, extra = {}) {
  return {
    id: group.id,
    name: group.name,
    description: group.description ?? "",
    status: group.status,
    createdAt: group.created_at,
    teacherId: group.teacher_id,
    teacherName: group.teacher?.user?.name ?? null,
    studentCount: studentCount ?? 0,
    enabledTopics: [],
    activityCount: (activityCount ?? 0) + (extra.topicActivityCount ?? 0),
    groupDir: group.group_dir ?? null,
    inviteToken: group.invite_token ?? null,
    activeNow: extra.activeNow ?? 0,
    averageScore: extra.averageScore ?? null,
  }
}

const inviteTokenSchema = z.object({
  token: z
    .string({
      required_error: "Se requiere el enlace de inscripción",
      invalid_type_error: "Se requiere el enlace de inscripción",
    })
    .min(1, "Se requiere el enlace de inscripción"),
})

module.exports = { createGroupSchema, registerStudentSchema, inviteTokenSchema, serializeGroup }
