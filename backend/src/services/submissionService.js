const { randomUUID } = require("crypto")
const prisma = require("../../prisma/client")
const logger = require("../lib/logger")
const { AppError, NotFoundError, AuthorizationError } = require("../lib/errors")
const accessService = require("./accessService")
const linuxAccountService = require("./linuxAccountService")
const sshClient = require("./sshService")
const bucket = require("../config/firebase-storage")
const { audit } = require("./auditService")

/**
 * Crea una entrega de una actividad manual: captura el estado del
 * directorio de trabajo del estudiante como un tarball, lo sube a
 * Firebase Storage y registra la submission en la BD.
 */
async function createSubmission(studentUserId, groupActivityId) {
  const ga = await prisma.groupActivity.findUnique({
    where: { id: groupActivityId },
    select: {
      id: true,
      group_id: true,
      title: true,
      workdir: true,
      evaluation_type: true,
      enabled: true,
      due_at: true,
      activity_type: true,
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
  if (ga.evaluation_type !== "manual") {
    throw new AppError("Esta actividad se evalúa automáticamente", 409, "CONFLICT")
  }

  const account = await linuxAccountService.getStudentAccount(studentUserId)
  const submissionId = randomUUID()

  const SUBMISSION = "/usr/local/lib/linuxlab/submitter.py"

  const { stdout: treeOut } = await sshClient.execCommand(
    `sudo -u ${account.linux_username} ${SUBMISSION}`,
    { stdin: JSON.stringify({ action: "tree", workdir: ga.workdir }) },
  )
  let treeResult
  try {
    treeResult = JSON.parse(treeOut)
  } catch {
    throw new AppError("No se pudo leer la carpeta de trabajo", 502, "INTERNAL_ERROR")
  }
  if (!treeResult.ok) {
    throw new AppError(treeResult.error || "No se pudo leer la carpeta de trabajo", 400, "VALIDATION_ERROR")
  }
  const tree = treeResult.tree ?? []
  if (tree.length === 0) {
    throw new AppError("La carpeta de trabajo está vacía; trabaja en ella antes de entregar", 400, "VALIDATION_ERROR")
  }

  const tarballPath = `submissions/${ga.group_id}/${submissionId}.tar.gz`
  const remoteTmp = `/tmp/${submissionId}.tar.gz`

  const { stdout: tarOut } = await sshClient.execCommand(
    `sudo -u ${account.linux_username} ${SUBMISSION}`,
    { stdin: JSON.stringify({ action: "tarball", workdir: ga.workdir, dest: remoteTmp }) },
  )
  let tarResult
  try {
    tarResult = JSON.parse(tarOut)
  } catch {
    throw new AppError("No se pudo crear el archivo de entrega", 502, "INTERNAL_ERROR")
  }
  if (!tarResult.ok) {
    throw new AppError(tarResult.error || "No se pudo crear el archivo de entrega", 400, "VALIDATION_ERROR")
  }
  const totalBytes = tarResult.totalBytes

  const { stdout: tarballB64 } = await sshClient.execCommand(
    `base64 ${remoteTmp}`,
    { timeoutMs: 30000 },
  )
  const tarballBuffer = Buffer.from(tarballB64, "base64")

  await bucket.file(tarballPath).save(tarballBuffer, {
    contentType: "application/gzip",
    metadata: { customMetadata: { studentId: studentUserId, groupActivityId } },
  })

  await sshClient.execCommand(`rm ${remoteTmp}`)

  const existingCount = await prisma.activitySubmission.count({
    where: { group_activity_id: ga.id, student_id: studentUserId },
  })

  const submission = await prisma.activitySubmission.create({
    data: {
      group_activity_id: ga.id,
      student_id: studentUserId,
      attempt_number: existingCount + 1,
      status: "submitted",
      evidence: {
        storagePath: tarballPath,
        tree,
        files: tree.length,
        totalBytes,
        submittedAt: new Date().toISOString(),
      },
    },
  })

  audit({
    userId: studentUserId,
    groupId: ga.group_id,
    eventType: "activity_submitted",
    target: ga.title,
    metadata: { groupActivityId: ga.id, submissionId: submission.id, files: tree.length },
  })

  logger.info({ groupActivityId: ga.id, studentUserId, submissionId: submission.id }, "Activity submitted")
  return {
    id: submission.id,
    status: submission.status,
    attemptNumber: submission.attempt_number,
    evidence: submission.evidence,
    submittedAt: submission.submitted_at.toISOString(),
  }
}

/**
 * Detalle de una entrega para el docente o el estudiante dueño.
 */
async function getSubmission(submissionId, userId, role) {
  const submission = await prisma.activitySubmission.findUnique({
    where: { id: submissionId },
    include: {
      groupActivity: { select: { id: true, group_id: true, title: true, max_score: true } },
      student: { select: { id: true, name: true, email: true, code: true } },
      grader: { select: { name: true } },
    },
  })
  if (!submission) throw new NotFoundError("Entrega no encontrada")

  if (role === "student" && submission.student_id !== userId) {
    throw new AuthorizationError("No puedes ver entregas de otros estudiantes")
  }
  if (role === "teacher") {
    await accessService.ensureGroupAccess({
      groupId: submission.groupActivity.group_id,
      teacherUserId: userId,
      role,
    })
  }

  return {
    id: submission.id,
    status: submission.status,
    attemptNumber: submission.attempt_number,
    evidence: submission.evidence,
    score: submission.score,
    feedback: submission.feedback,
    gradedBy: submission.grader?.name ?? null,
    gradedAt: submission.graded_at?.toISOString() ?? null,
    submittedAt: submission.submitted_at.toISOString(),
    student: {
      id: submission.student.id,
      name: submission.student.name,
      email: submission.student.email,
      code: submission.student.code,
    },
    activity: {
      id: submission.groupActivity.id,
      title: submission.groupActivity.title,
      maxScore: submission.groupActivity.max_score,
    },
  }
}

/**
 * Contenido de un archivo específico del tarball.
 */
async function getFileContent(submissionId, filePath, userId, role) {
  const submission = await prisma.activitySubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      evidence: true,
      groupActivity: { select: { group_id: true } },
    },
  })
  if (!submission) throw new NotFoundError("Entrega no encontrada")
  if (role === "teacher") {
    await accessService.ensureGroupAccess({
      groupId: submission.groupActivity.group_id,
      teacherUserId: userId,
      role,
    })
  }

  const storagePath = submission.evidence.storagePath
  const [tarballBuffer] = await bucket.file(storagePath).download()

  const { Readable } = require("stream")
  const { createGunzip } = require("zlib")
  const tar = require("tar")
  let content = ""
  const gunzip = createGunzip()
  const parser = new tar.Parser()
  parser.on("entry", (entry) => {
    const entryPath = entry.path
    if (entryPath === filePath || entryPath === `./${filePath}`) {
      const chunks = []
      entry.on("data", (chunk) => chunks.push(chunk))
      entry.on("end", () => {
        content = Buffer.concat(chunks).toString("utf8")
      })
    } else {
      entry.resume()
    }
  })
  Readable.from(tarballBuffer).pipe(gunzip).pipe(parser)
  await new Promise((resolve, reject) => {
    parser.on("end", resolve)
    parser.on("error", reject)
  })
  return content
}

/**
 * URL firmada para descargar el tarball completo.
 */
async function getDownloadUrl(submissionId, userId, role) {
  const submission = await prisma.activitySubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      evidence: true,
      groupActivity: { select: { group_id: true } },
    },
  })
  if (!submission) throw new NotFoundError("Entrega no encontrada")
  if (role === "teacher") {
    await accessService.ensureGroupAccess({
      groupId: submission.groupActivity.group_id,
      teacherUserId: userId,
      role,
    })
  }

  const [url] = await bucket.file(submission.evidence.storagePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  })

  return url
}

/**
 * Califica una entrega (RF-MAN-04, RF-MAN-05).
 */
async function gradeSubmission(submissionId, teacherUserId, score, feedback) {
  const submission = await prisma.activitySubmission.findUnique({
    where: { id: submissionId },
    include: {
      groupActivity: { select: { id: true, group_id: true, title: true, max_score: true } },
    },
  })
  if (!submission) throw new NotFoundError("Entrega no encontrada")
  await accessService.ensureGroupAccess({
    groupId: submission.groupActivity.group_id,
    teacherUserId,
    role: "teacher",
  })

  if (score < 0 || score > submission.groupActivity.max_score) {
    throw new AppError(
      `La calificación debe estar entre 0 y ${submission.groupActivity.max_score}`,
      400,
      "VALIDATION_ERROR",
    )
  }

  const updated = await prisma.activitySubmission.update({
    where: { id: submissionId },
    data: {
      score,
      feedback: feedback || null,
      status: "graded",
      graded_by: teacherUserId,
      graded_at: new Date(),
    },
  })

  audit({
    userId: teacherUserId,
    groupId: submission.groupActivity.group_id,
    eventType: "activity_graded",
    target: submission.groupActivity.title,
    metadata: {
      submissionId,
      studentId: submission.student_id,
      score,
      previousStatus: submission.status,
    },
  })

  logger.info({ submissionId, teacherUserId, score }, "Submission graded")
  return {
    id: updated.id,
    status: updated.status,
    score: updated.score,
    feedback: updated.feedback,
    gradedAt: updated.graded_at.toISOString(),
  }
}

module.exports = {
  createSubmission,
  getSubmission,
  getFileContent,
  getDownloadUrl,
  gradeSubmission,
}
