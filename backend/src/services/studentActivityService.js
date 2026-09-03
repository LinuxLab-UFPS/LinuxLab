const prisma = require("../../prisma/client")
const { randomUUID } = require("crypto")
const sshClient = require("./sshService")
const logger = require("../lib/logger")
const { AppError, NotFoundError, AuthorizationError } = require("../lib/errors")
const linuxAccountService = require("./linuxAccountService")
const accessService = require("./accessService")
const lessonEvaluatorService = require("./lessonEvaluatorService")
const attemptService = require("./attemptService")
const { finalScore } = require("../utils/finalScore")
const { bankSlugOf, bankActivityId, workdirOf } = require("../dtos/activityDtos")
const { audit } = require("./auditService")

const { personalize, CHECKER, EVAL_TIMEOUT_MS } = lessonEvaluatorService

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

function withIds(checks) {
  return (checks ?? []).map((c) => ({
    id: c.id ?? randomUUID(),
    type: c.type,
    params: c.params,
    points: c.points,
    position: c.position ?? 0,
  }))
}

async function listMine(studentUserId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentUserId, status: "active", group: { status: "active" } },
    include: { group: { include: { teacher: { select: { user: { select: { name: true } } } } } } },
    orderBy: { created_at: "asc" },
  })
  if (!enrollment) return { group: null, activities: [] }

  // Aqui solo van las del docente. Las del curso viven en `TopicActivity` y
  // se listan por su lado; antes se publicaban tambien como `GroupActivity` y
  // habia que excluirlas por su origen, pero esa publicacion ya no existe.
  const rows = await prisma.groupActivity.findMany({
    where: {
      group_id: enrollment.group_id,
      enabled: true,
    },
    include: {
      submissions: {
        where: { enrollment_id: enrollment.id },
        orderBy: { created_at: "desc" },
        select: {
          passed: true, score: true, created_at: true, status: true,
          autoDetail: { select: { auto_results: true } },
          manualDetail: { select: { evidence: true, feedback: true, graded_by: true, graded_at: true } },
        },
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
      const submissions = ga.submissions ?? []
      const autoSubs = submissions.filter((s) => s.autoDetail !== null)
      const manualSubs = submissions.filter((s) => s.manualDetail !== null)
      const latestManual = manualSubs[0] ?? null
      const hasSubmission = latestManual !== null
      const attempts = autoSubs
      return {
        id: ga.id,
        title: ga.title,
        description: ga.instructions ?? "",
        // El tema real de la actividad: el catalogo del estudiante ordena por
        // el para mezclar en una sola lista las del temario y las del docente.
        // Null en las que el docente creo sin tema, que van al final.
        topicNumber: ga.topic_number ?? null,
        checksCount: (ga.checks ?? []).length,
        passed: attempts[0]?.passed ?? false,
        completed: attempts.length > 0 || hasSubmission,
        lastScore: attempts[0]?.score ?? null,
        attemptsCount: attempts.length,
        attemptLimit: ga.attempt_limit,
        finalScore: ga.evaluation_type === "manual"
          ? (latestManual?.score ?? 0)
          : finalScore(attempts.map((a) => ({ score: a.score, created_at: a.created_at }))),
        dueAt: ga.due_at?.toISOString() ?? null,
        enabled: ga.enabled,
        evaluationType: ga.evaluation_type === "manual" ? "manual" : "atomic",
        activityType: ga.activity_type === "quiz" ? "quiz" : "workshop",
        submission: latestManual ? {
          id: latestManual.id,
          status: latestManual.status,
          score: latestManual.score,
          feedback: latestManual.manualDetail?.feedback ?? null,
          submittedAt: latestManual.created_at.toISOString(),
          files: latestManual.manualDetail?.evidence?.files ?? 0,
        } : null,
      }
    }),
  }
}

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

  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentUserId, group_id: ga.group_id, status: "active" },
    select: { id: true },
  })
  const enrollmentId = enrollment?.id

  const submissions = enrollmentId
    ? await prisma.groupSubmission.findMany({
        where: { enrollment_id: enrollmentId, group_activity_id: ga.id },
        orderBy: { created_at: "desc" },
        include: {
          autoDetail: { select: { auto_results: true } },
          manualDetail: { select: { evidence: true, feedback: true, graded_by: true, graded_at: true } },
        },
      })
    : []

  const autoSubs = submissions.filter((s) => s.autoDetail !== null)
  const manualSubs = submissions.filter((s) => s.manualDetail !== null)
  const latestManual = manualSubs[0] ?? null
  const hasSubmission = latestManual !== null

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
    attemptsCount: autoSubs.length,
    finalScore: ga.evaluation_type === "manual"
      ? (latestManual?.score ?? 0)
      : finalScore(autoSubs.map((a) => ({ score: a.score, created_at: a.created_at }))),
    completed: autoSubs.length > 0 || hasSubmission,
    enabled: true,
    attempts: autoSubs.map((s) => ({
      attemptNumber: s.attempt_number,
      createdAt: s.created_at.toISOString(),
      passed: s.passed,
      score: s.score,
    })),
    lastAttempt: autoSubs[0]
      ? { passed: autoSubs[0].passed, score: autoSubs[0].score, results: autoSubs[0].autoDetail?.auto_results ?? [] }
      : null,
    submission: latestManual ? {
      id: latestManual.id,
      status: latestManual.status,
      score: latestManual.score,
      feedback: latestManual.manualDetail?.feedback ?? null,
      submittedAt: latestManual.created_at.toISOString(),
      files: latestManual.manualDetail?.evidence?.files ?? 0,
    } : null,
  }
}

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
  const checks = withIds(ga.checks)
  if (checks.length === 0) {
    throw new AppError("La actividad no tiene aserciones que evaluar", 409, "CONFLICT")
  }

  const account = await linuxAccountService.getStudentAccount(studentUserId)

  const student = await prisma.user.findUnique({
    where: { id: studentUserId },
    select: { student: { select: { code: true } }, email: true },
  })

  // La carpeta de la actividad viaja en el payload para que el checker muestre
  // en sus mensajes la ruta tal como la escribio el docente (relativa a esa
  // carpeta) y no el camino completo desde el home: dos aserciones que apuntan
  // a un archivo con el mismo nombre en carpetas distintas dejan de producir
  // mensajes identicos que parezcan contradictorios. Un checker antiguo la
  // ignora y un checker nuevo sin ella muestra la ruta relativa al home.
  const payload = JSON.stringify({
    workdir: ga.workdir ? `actividades/${ga.workdir}` : undefined,
    checks: checks.map((c) => ({
      id: c.id,
      type: c.type,
      params: personalize(resolveRuta(c.params, ga.workdir), { code: student?.student?.code, email: student?.email }),
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
  // `params` se queda en el servidor. Lleva el valor esperado (el contenido
  // exacto de un archivo, el modo octal, la ultima linea), asi que mandarlo al
  // navegador entrega la respuesta a quien abra las herramientas de desarrollo.
  // El estudiante recibe el tipo, los puntos y el `detail`, que dice que esta
  // mal sin decir cual era la respuesta.
  const results = checks.map((check) => {
    const outcome = byId.get(check.id)
    return {
      id: check.id,
      type: check.type,
      points: check.points,
      passed: outcome?.passed ?? false,
      detail:
        outcome?.detail ??
        "No pude revisar esta comprobación en tu entorno. Vuelve a intentarlo; si el problema continúa, avisa a tu docente.",
    }
  })

  const score = results.reduce((total, r) => total + (r.passed ? r.points : 0), 0)
  const passed = score >= 60

  await attemptService.recordGroupAttempt({
    studentId: studentUserId,
    groupId: ga.group_id,
    groupActivityId: ga.id,
    score,
    passed,
    results,
    attemptLimit: ga.attempt_limit,
  })

  const submissions = await prisma.groupSubmission.findMany({
    where: { enrollment: { student_id: studentUserId }, group_activity_id: ga.id },
    orderBy: { created_at: "desc" },
    select: { attempt_number: true, score: true, passed: true, created_at: true },
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
    finalScore: finalScore(submissions.map((s) => ({ score: s.score, created_at: s.created_at }))),
    attemptsCount: submissions.length,
    attempts: submissions.map((s) => ({
      attemptNumber: s.attempt_number,
      createdAt: s.created_at.toISOString(),
      passed: s.passed,
      score: s.score,
    })),
    maxScore: ga.max_score,
    results,
  }
}

/**
 * El detalle de un estudiante en una actividad del temario, con la misma forma
 * que el de una del docente: la vista no distingue de donde salio la actividad.
 *
 * Los intentos viven en `TopicSubmission` y son todos automaticos; la
 * matricula tiene que ser del grupo que pide la vista y estar activa, igual
 * que en la via del docente.
 */
async function getStudentTemarioDetail(groupId, slug, studentId, userId, role) {
  const ta = await prisma.topicActivity.findFirst({
    where: { slug, kind: "activity" },
  })
  if (!ta) throw new NotFoundError("Actividad no encontrada")

  if (role === "teacher") {
    await accessService.ensureGroupAccess({ groupId, teacherUserId: userId, role })
  } else if (role === "student" && studentId !== userId) {
    throw new AuthorizationError("No puedes ver entregas de otros estudiantes")
  }

  const studentUser = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, student: { select: { code: true } } },
  })
  if (!studentUser) throw new NotFoundError("Estudiante no encontrado")

  // Lectura de historial: no se exige status "active". Al finalizar o
  // archivar un grupo las matriculas pasan a "archived" y esta vista debe
  // seguir mostrando intentos, notas y retroalimentacion tal como quedaron.
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentId, group_id: groupId },
    select: { id: true },
  })

  const submissions = enrollment
    ? await prisma.topicSubmission.findMany({
        where: { enrollment_id: enrollment.id, topic_activity_id: ta.id },
        orderBy: { created_at: "desc" },
      })
    : []

  return {
    type: "automatic",
    student: {
      id: studentUser.id,
      name: studentUser.name,
      email: studentUser.email,
      code: studentUser.student?.code ?? null,
    },
    activity: {
      id: bankActivityId(ta.slug),
      title: ta.title,
      instructions: ta.instructions ?? "",
      workdir: workdirOf(ta.slug),
      evaluationType: "atomic",
      activityType: null,
      maxScore: 100,
    },
    attempts: submissions.map((s) => ({
      attemptNumber: s.attempt_number,
      passed: s.passed,
      score: s.score,
      results: s.auto_results ?? [],
      createdAt: s.created_at.toISOString(),
    })),
    finalScore: finalScore(submissions.map((s) => ({ score: s.score, created_at: s.created_at }))),
  }
}

async function getStudentActivityDetail(groupId, activityId, studentId, userId, role) {
  const slug = bankSlugOf(activityId)
  if (slug) return getStudentTemarioDetail(groupId, slug, studentId, userId, role)

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

  const studentUser = await prisma.user.findUnique({
    where: { id: studentId },
    select: { id: true, name: true, email: true, student: { select: { code: true } } },
  })
  if (!studentUser) throw new NotFoundError("Estudiante no encontrado")
  const student = {
    id: studentUser.id,
    name: studentUser.name,
    email: studentUser.email,
    code: studentUser.student?.code ?? null,
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

  // Lectura de historial: no se exige status "active". Al finalizar o
  // archivar un grupo las matriculas pasan a "archived", pero las entregas
  // (nota, intentos y retroalimentacion) deben seguir visibles para el
  // docente. Las escrituras (check/submit) si exigen matricula activa.
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentId, group_id: groupId },
    select: { id: true },
  })
  const enrollmentId = enrollment?.id

  if (ga.evaluation_type === "manual") {
    const submission = enrollmentId
      ? await prisma.groupSubmission.findFirst({
          where: { enrollment_id: enrollmentId, group_activity_id: ga.id },
          orderBy: { created_at: "desc" },
          include: { manualDetail: { include: { grader: { select: { user: { select: { name: true } } } } } } },
        })
      : null

    return {
      type: "manual",
      student,
      activity,
      submission: submission ? {
        id: submission.id,
        status: submission.status,
        evidence: submission.manualDetail?.evidence ?? null,
        score: submission.score,
        feedback: submission.manualDetail?.feedback ?? null,
        gradedBy: submission.manualDetail?.grader?.user?.name ?? null,
        gradedAt: submission.manualDetail?.graded_at?.toISOString() ?? null,
        submittedAt: submission.created_at.toISOString(),
      } : null,
    }
  }

  const submissions = enrollmentId
    ? await prisma.groupSubmission.findMany({
        where: { enrollment_id: enrollmentId, group_activity_id: ga.id },
        orderBy: { created_at: "desc" },
        include: { autoDetail: { select: { auto_results: true } } },
      })
    : []

  return {
    type: "automatic",
    student,
    activity,
    attempts: submissions.map((s) => ({
      attemptNumber: s.attempt_number,
      passed: s.passed,
      score: s.score,
      results: s.autoDetail?.auto_results ?? [],
      createdAt: s.created_at.toISOString(),
    })),
    finalScore: finalScore(submissions.map((s) => ({ score: s.score, created_at: s.created_at }))),
  }
}

module.exports = { listMine, getForStudent, checkForStudent, getStudentActivityDetail }
