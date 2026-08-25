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
    activityCount: activityCount ?? 0,
    groupDir: group.group_dir ?? null,
    activeNow: extra.activeNow ?? 0,
    averageScore: extra.averageScore ?? null,
  }
}

module.exports = { createGroupSchema, registerStudentSchema, serializeGroup }
