const { z } = require("zod")

/**
 * Configuracion comun de una actividad de grupo, validada con zod antes de la
 * logica de negocio. Las aserciones (checks) no viven aqui: su validacion
 * depende del catalogo dinamico (checkCatalog) y del puntaje repartido, y la
 * hace buildChecks en el servicio.
 */
const activityInputSchema = z.object({
  title: z
    .string({
      required_error: "El nombre de la actividad es requerido",
      invalid_type_error: "El nombre de la actividad es requerido",
    })
    .trim()
    .min(1, "El nombre de la actividad es requerido")
    .max(255, "El nombre de la actividad no puede superar los 255 caracteres"),
  instructions: z
    .string()
    .trim()
    .max(2000, "La descripción no puede superar los 2000 caracteres")
    .optional()
    .nullable(),
  // null o ausente = intentos ilimitados; un entero positivo = límite.
  attemptLimit: z.number().int().positive().nullable().optional(),
  activityType: z.enum(["workshop", "quiz"]).default("workshop"),
  // "atomic" es una alias historico de "automatic" (lo normaliza el servicio).
  evaluationType: z.string().optional(),
  dueDate: z.string().optional().nullable(),
  topicNumber: z.union([z.number(), z.string()]).optional(),
  checks: z.array(z.unknown()).optional(),
})

/** La forma que espera el frontend para la tabla de actividades de un curso. */
function serializeGroupActivity(ga, definition) {
  return {
    id: ga.id,
    title: ga.title,
    topicNumber: definition?.topic_number ?? 0,
    source: "teacher",
    difficulty: definition?.difficulty ?? "basic",
    instructions: ga.instructions ?? "",
    maxScore: ga.max_score,
    dueDate: ga.due_at?.toISOString(),
    required: ga.required,
    evaluationType: ga.evaluation_type === "manual" ? "manual" : "atomic",
    activityType: ga.activity_type === "quiz" ? "quiz" : "workshop",
    attemptLimit: ga.attempt_limit,
    workdir: ga.workdir,
    enabled: ga.enabled,
    checks: (ga.checks ?? []).map((c) => ({
      id: c.id,
      type: c.type,
      params: c.params,
      points: c.points,
    })),
    uses: 0,
  }
}

module.exports = { activityInputSchema, serializeGroupActivity }
