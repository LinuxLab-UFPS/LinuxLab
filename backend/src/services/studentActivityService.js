const prisma = require("../../prisma/client")
const sshClient = require("./sshService")
const logger = require("../lib/logger")
const { AppError, NotFoundError, AuthorizationError } = require("../lib/errors")
const linuxAccountService = require("./linuxAccountService")
const accessService = require("./accessService")
const lessonEvaluatorService = require("./lessonEvaluatorService")
const attemptService = require("./attemptService")
const { finalScore } = require("../utils/finalScore")
const { audit } = require("./auditService")

const { personalize, CHECKER, EVAL_TIMEOUT_MS } = lessonEvaluatorService

/**
 * Resuelve las rutas de las aserciones contra la carpeta de trabajo: las
 * relativas se anteponen `actividades/<workdir>/`; las absolutas se respetan
 * (las comprobaciones del temario backfilled las usan).
 */
function resolveRuta(params, workdir) {
  const output = {}
  for (const [key, value] of Object.entries(params ?? {})) {
    output[key] =
      key === "ruta" && typeof value === "string" && value.trim() && !value.startsWith("/")
        ? `actividades/${workdir}/${value}`
        : value
  }
  return output
}

/**
 * El grupo de laboratorio del estudiante (su matricula activa) y sus
 * actividades de curso, para la vista "Mi Grupo". El estudiante tiene un solo
 * grupo activo; si no tiene ninguno, `group` es null.
 */
async function listMine(studentUserId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentUserId, status: "active", group: { archived: false } },
    include: { group: { include: { teacher: { include: { user: { select: { name: true } } } } } } },
    orderBy: { enrolled_at: "asc" },
  })
  if (!enrollment) return { group: null, activities: [] }

  const rows = await prisma.groupActivity.findMany({
    where: { group_id: enrollment.group_id, enabled: true },
    include: {
      definition: { select: { topic_number: true } },
      attempts: {
        where: { student_id: studentUserId },
        orderBy: { created_at: "desc" },
        select: { passed: true, score: true, created_at: true },
      },
      submissions: {
        where: { student_id: studentUserId },
        orderBy: { submitted_at: "desc" },
        take: 1,
        select: { id: true, status: true, score: true, feedback: true, submitted_at: true, evidence: true },
      },
    },
    orderBy: { created_at: "desc" },
  })

  return {
    group: {
      id: enrollment.group.id,
      name: enrollment.group.name,
      description: enrollment.group.description ?? "",
      teacherName: enrollment.group.teacher?.user?.name ?? "",
    },
    activities: rows.map((ga) => {
      const attempts = ga.attempts ?? []
      const submissions = ga.submissions ?? []
      const latestSubmission = submissions[0] ?? null
      const hasSubmission = latestSubmission !== null
      return {
        id: ga.id,
        title: ga.title,
        description: ga.instructions ?? "",
        topicNumber: ga.definition?.topic_number ?? 0,
        checksCount: (ga.checks ?? []).length,
        passed: attempts[0]?.passed ?? false,
        completed: attempts.length > 0 || hasSubmission,
        lastScore: attempts[0]?.score ?? null,
        attemptsCount: attempts.length,
        attemptLimit: ga.attempt_limit,
        finalScore: ga.evaluation_type === "manual"
          ? (latestSubmission?.score ?? 0)
          : finalScore(attempts),
        dueAt: ga.due_at?.toISOString() ?? null,
        enabled: ga.enabled,
        evaluationType: ga.evaluation_type === "manual" ? "manual" : "atomic",
        activityType: ga.activity_type === "quiz" ? "quiz" : "workshop",
        submission: latestSubmission ? {
          id: latestSubmission.id,
          status: latestSubmission.status,
          score: latestSubmission.score,
          feedback: latestSubmission.feedback,
          submittedAt: latestSubmission.submitted_at.toISOString(),
          files: latestSubmission.evidence?.files ?? 0,
        } : null,
      }
    }),
  }
}

/** Detalle que ve el estudiante: sin los criterios (ocultos hasta aprobar). */
async function getForStudent(studentUserId, groupActivityId) {
  const ga = await prisma.groupActivity.findFirst({
    where: { id: groupActivityId, enabled: true },
    select: {
      id: true,
      group_id: true,
      title: true,
      instructions: true,
      workdir: true,
      due_at: true,
      evaluation_type: true,
      activity_type: true,
      max_score: true,
      checks: true,
      attempt_limit: true,
      enabled: true,
    },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  if (!(await accessService.hasEnrollmentInGroup(studentUserId, ga.group_id))) {
    throw new AuthorizationError("No estás inscrito en el curso de esta actividad")
  }

  const attempts = await prisma.activityAttempt.findMany({
    where: { group_activity_id: ga.id, student_id: studentUserId },
    orderBy: { created_at: "desc" },
    select: { attempt_number: true, passed: true, score: true, results: true, created_at: true },
  })

  const submissions = await prisma.activitySubmission.findMany({
    where: { group_activity_id: ga.id, student_id: studentUserId },
    orderBy: { submitted_at: "desc" },
    take: 1,
    select: { id: true, status: true, score: true, feedback: true, submitted_at: true, evidence: true },
  })
  const latestSubmission = submissions[0] ?? null
  const hasSubmission = latestSubmission !== null

  return {
    id: ga.id,
    groupId: ga.group_id,
    title: ga.title,
    instructions: ga.instructions ?? "",
    workdir: ga.workdir,
    dueAt: ga.due_at?.toISOString() ?? null,
    evaluationType: ga.evaluation_type === "manual" ? "manual" : "atomic",
    activityType: ga.activity_type === "quiz" ? "quiz" : "workshop",
    maxScore: ga.max_score,
    checksCount: (ga.checks ?? []).length,
    attemptLimit: ga.attempt_limit,
    attemptsCount: attempts.length,
    finalScore: ga.evaluation_type === "manual"
      ? (latestSubmission?.score ?? 0)
      : finalScore(attempts),
    completed: attempts.length > 0 || hasSubmission,
    enabled: true,
    attempts: attempts.map((attempt) => ({
      attemptNumber: attempt.attempt_number,
      createdAt: attempt.created_at.toISOString(),
      passed: attempt.passed,
      score: attempt.score,
    })),
    lastAttempt: attempts[0]
      ? { passed: attempts[0].passed, score: attempts[0].score, results: attempts[0].results ?? [] }
      : null,
    submission: latestSubmission ? {
      id: latestSubmission.id,
      status: latestSubmission.status,
      score: latestSubmission.score,
      feedback: latestSubmission.feedback,
      submittedAt: latestSubmission.submitted_at.toISOString(),
      files: latestSubmission.evidence?.files ?? 0,
    } : null,
  }
}

/**
 * Evalua la actividad de curso contra el entorno del estudiante (RF-AUTO-02).
 *
 * Misma maquinaria que la linea base: el checker corre CON LA IDENTIDAD del
 * estudiante, los parametros viajan por stdin y las rutas relativas se
 * resuelven contra la carpeta de trabajo antes de mandar el payload.
 */
async function checkForStudent(studentUserId, groupActivityId) {
  const ga = await prisma.groupActivity.findUnique({
    where: { id: groupActivityId },
    select: {
      id: true,
      group_id: true,
      title: true,
      workdir: true,
      checks: true,
      evaluation_type: true,
      activity_type: true,
      max_score: true,
      enabled: true,
      due_at: true,
      activity_definition_id: true,
      attempt_limit: true,
    },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")
  if (!(await accessService.hasEnrollmentInGroup(studentUserId, ga.group_id))) {
    throw new AuthorizationError("No estás inscrito en el curso de esta actividad")
  }
  if (!ga.enabled) throw new AppError("La actividad está deshabilitada", 409, "CONFLICT")
  if (ga.due_at && ga.due_at <= new Date()) {
    throw new AppError("La actividad ya venció", 409, "CONFLICT")
  }
  if (ga.evaluation_type !== "automatic") {
    throw new AppError("Esta actividad se revisa manualmente", 409, "CONFLICT")
  }
  if (!ga.activity_definition_id) {
    throw new AppError("La actividad ya no está disponible", 409, "CONFLICT")
  }
  const checks = ga.checks ?? []
  if (checks.length === 0) {
    throw new AppError("La actividad no tiene aserciones que evaluar", 409, "CONFLICT")
  }

  const account = await linuxAccountService.getStudentAccount(studentUserId)

  const student = await prisma.user.findUnique({
    where: { id: studentUserId },
    select: { email: true, studentProfile: { select: { code: true } } },
  })

  const payload = JSON.stringify({
    checks: checks.map((c) => ({
      id: c.id,
      type: c.type,
      params: personalize(resolveRuta(c.params, ga.workdir), student),
    })),
  })

  const { code, stdout, stderr } = await sshClient.execCommand(
    `sudo -u ${account.linux_username} ${CHECKER}`,
    { stdin: payload, timeoutMs: EVAL_TIMEOUT_MS },
  )

  let parsed
  try {
    parsed = JSON.parse(stdout)
  } catch {
    logger.error({ code, stderr, groupActivityId: ga.id }, "Checker output was not JSON")
    throw new AppError("No se pudo evaluar tu entorno, inténtalo de nuevo", 502, "INTERNAL_ERROR")
  }

  const byId = new Map(parsed.results.map((r) => [r.id, r]))
  const results = checks.map((check) => {
    const outcome = byId.get(check.id)
    return {
      id: check.id,
      type: check.type,
      params: check.params,
      points: check.points,
      passed: outcome?.passed ?? false,
      detail: outcome?.detail ?? "No se pudo evaluar",
    }
  })

  const score = results.reduce((total, r) => total + (r.passed ? r.points : 0), 0)
  // La actividad se aprueba con una nota de 60 o mas (sobre max_score=100).
  const passed = score >= 60

  await attemptService.recordAttempt({
    activityDefinitionId: ga.activity_definition_id,
    groupActivityId: ga.id,
    studentUserId,
    passed,
    score,
    results,
    attemptLimit: ga.attempt_limit,
  })

  const attempts = await prisma.activityAttempt.findMany({
    where: { group_activity_id: ga.id, student_id: studentUserId },
    orderBy: { created_at: "desc" },
    select: { attempt_number: true, score: true, created_at: true },
  })

  audit({
    userId: studentUserId,
    groupId: ga.group_id,
    eventType: "activity_checked",
    target: ga.title,
    metadata: { groupActivityId: ga.id, passed, score },
  })

  logger.info({ groupActivityId: ga.id, username: account.linux_username, passed, score }, "Group activity checked")
  return {
    passed,
    completed: true,
    score,
    finalScore: finalScore(attempts),
    attemptsCount: attempts.length,
    attempts: attempts.map((attempt) => ({
      attemptNumber: attempt.attempt_number,
      createdAt: attempt.created_at.toISOString(),
      passed: attempt.passed,
      score: attempt.score,
    })),
    maxScore: ga.max_score,
    results,
  }
}

/**
 * Detalle de la actividad de un estudiante específico (vista docente/estudiante).
 *
 * Para actividades manuales: retorna la submission con evidence (archivos).
 * Para actividades automáticas: retorna los intentos con results (aserciones).
 */
async function getStudentActivityDetail(groupId, activityId, studentId, userId, role) {
  const ga = await prisma.groupActivity.findFirst({
    where: { id: activityId, group_id: groupId },
    select: {
      id: true,
      group_id: true,
      title: true,
      instructions: true,
      workdir: true,
      evaluation_type: true,
      activity_type: true,
      max_score: true,
    },
  })
  if (!ga) throw new NotFoundError("Actividad no encontrada")

  if (role === "teacher") {
    await accessService.ensureGroupAccess({ groupId, teacherUserId: userId, role })
  } else if (role === "student" && studentId !== userId) {
    throw new AuthorizationError("No puedes ver entregas de otros estudiantes")
  }

  const student = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, studentProfile: { select: { code: true } } },
  })
  if (!student) throw new NotFoundError("Estudiante no encontrado")

  // El contrato con el frontend mantiene `code` plano en la raiz del estudiante.
  const studentView = {
    id: student.id,
    name: student.name,
    email: student.email,
    code: student.studentProfile?.code ?? null,
  }

  const activity = {
    id: ga.id,
    title: ga.title,
    instructions: ga.instructions ?? "",
    workdir: ga.workdir,
    evaluationType: ga.evaluation_type === "manual" ? "manual" : "atomic",
    activityType: ga.activity_type === "quiz" ? "quiz" : "workshop",
    maxScore: ga.max_score,
  }

  if (ga.evaluation_type === "manual") {
    const submission = await prisma.activitySubmission.findFirst({
      where: { group_activity_id: ga.id, student_id: studentId },
      orderBy: { submitted_at: "desc" },
      include: { grader: { include: { user: { select: { name: true } } } } },
    })

    return {
      type: "manual",
      student: studentView,
      activity,
      submission: submission ? {
        id: submission.id,
        status: submission.status,
        evidence: submission.evidence,
        score: submission.score,
        feedback: submission.feedback,
        gradedBy: submission.grader?.user?.name ?? null,
        gradedAt: submission.graded_at?.toISOString() ?? null,
        submittedAt: submission.submitted_at.toISOString(),
      } : null,
    }
  }

  const attempts = await prisma.activityAttempt.findMany({
    where: { group_activity_id: ga.id, student_id: studentId },
    orderBy: { created_at: "desc" },
    select: {
      attempt_number: true,
      passed: true,
      score: true,
      results: true,
      created_at: true,
    },
  })

  return {
    type: "automatic",
    student: studentView,
    activity,
    attempts: attempts.map((a) => ({
      attemptNumber: a.attempt_number,
      passed: a.passed,
      score: a.score,
      results: a.results,
      createdAt: a.created_at.toISOString(),
    })),
    finalScore: finalScore(attempts),
  }
}

module.exports = { listMine, getForStudent, checkForStudent, getStudentActivityDetail }
