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

  const rows = await prisma.groupActivity.findMany({
    where: { group_id: enrollment.group_id, enabled: true },
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
        topicNumber: 0,
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

  const payload = JSON.stringify({
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

  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentId, group_id: groupId, status: "active" },
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
