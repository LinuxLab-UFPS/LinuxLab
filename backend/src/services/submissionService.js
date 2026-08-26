const { randomUUID } = require("crypto")
const prisma = require("../../prisma/client")
const logger = require("../lib/logger")
const { AppError, NotFoundError, AuthorizationError, ConflictError } = require("../lib/errors")
const accessService = require("./accessService")
const linuxAccountService = require("./linuxAccountService")
const sshClient = require("./sshService")
const bucket = require("../config/firebase-storage")
const { audit } = require("./auditService")

async function getEnrollmentId(studentId, groupId) {
  const enrollment = await prisma.enrollment.findFirst({
    where: { student_id: studentId, group_id: groupId, status: "active" },
    select: { id: true },
  })
  return enrollment?.id ?? null
}

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
  const enrollmentId = await getEnrollmentId(studentUserId, ga.group_id)
  if (!enrollmentId) throw new ConflictError("No hay matrícula activa")

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

  const zipPath = `submissions/${ga.group_id}/${submissionId}.zip`
  const remoteTmp = `/tmp/${submissionId}.zip`

  const { stdout: zipOut } = await sshClient.execCommand(
    `sudo -u ${account.linux_username} ${SUBMISSION}`,
    { stdin: JSON.stringify({ action: "zipball", workdir: ga.workdir, dest: remoteTmp }) },
  )
  let zipResult
  try {
    zipResult = JSON.parse(zipOut)
  } catch {
    throw new AppError("No se pudo crear el archivo de entrega", 502, "INTERNAL_ERROR")
  }
  if (!zipResult.ok) {
    throw new AppError(zipResult.error || "No se pudo crear el archivo de entrega", 400, "VALIDATION_ERROR")
  }
  const totalBytes = zipResult.totalBytes

  const { stdout: zipB64 } = await sshClient.execCommand(
    `base64 ${remoteTmp}`,
    { timeoutMs: 30000 },
  )
  const zipBuffer = Buffer.from(zipB64, "base64")

  await bucket.file(zipPath).save(zipBuffer, {
    contentType: "application/zip",
    metadata: { customMetadata: { studentId: studentUserId, groupActivityId } },
  })

  await sshClient.execCommand(`rm ${remoteTmp}`)

  // Una sola entrega por estudiante: eliminar las anteriores (solo las manuales).
  await prisma.groupSubmission.deleteMany({
    where: { group_activity_id: ga.id, enrollment_id: enrollmentId, manualDetail: { isNot: null } },
  })

  const evidence = {
    storagePath: zipPath,
    tree,
    files: tree.length,
    totalBytes,
    submittedAt: new Date().toISOString(),
  }

  const submission = await prisma.groupSubmission.create({
    data: {
      enrollment_id: enrollmentId,
      group_activity_id: ga.id,
      attempt_number: 1,
      status: "submitted",
      manualDetail: { create: { evidence } },
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
    evidence,
    submittedAt: submission.created_at.toISOString(),
  }
}

async function getSubmission(submissionId, userId, role) {
  const submission = await prisma.groupSubmission.findUnique({
    where: { id: submissionId },
    include: {
      groupActivity: { select: { id: true, group_id: true, title: true, max_score: true } },
      enrollment: { include: { student: { include: { user: true } } } },
      manualDetail: { include: { grader: { include: { user: true } } } },
    },
  })
  if (!submission) throw new NotFoundError("Entrega no encontrada")

  const studentId = submission.enrollment?.student_id

  if (role === "student" && studentId !== userId) {
    throw new AuthorizationError("No puedes ver entregas de otros estudiantes")
  }
  if (role === "teacher") {
    await accessService.ensureGroupAccess({
      groupId: submission.groupActivity.group_id,
      teacherUserId: userId,
      role,
    })
  }

  const student = submission.enrollment?.student?.user
  const detail = submission.manualDetail

  return {
    id: submission.id,
    status: submission.status,
    attemptNumber: submission.attempt_number,
    evidence: detail?.evidence ?? null,
    score: submission.score,
    feedback: detail?.feedback ?? null,
    gradedBy: detail?.grader?.user?.name ?? null,
    gradedAt: detail?.graded_at?.toISOString() ?? null,
    submittedAt: submission.created_at.toISOString(),
    student: student ? {
      id: student.id,
      name: student.name,
      email: student.email,
      code: submission.enrollment?.student?.code ?? null,
    } : null,
    activity: {
      id: submission.groupActivity.id,
      title: submission.groupActivity.title,
      maxScore: submission.groupActivity.max_score,
    },
  }
}

async function getFileContent(submissionId, filePath, userId, role) {
  const submission = await prisma.groupSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      manualDetail: { select: { evidence: true } },
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

  const storagePath = submission.manualDetail?.evidence?.storagePath
  if (!storagePath) throw new AppError("La entrega no tiene archivos", 404, "NOT_FOUND")
  const [buffer] = await bucket.file(storagePath).download()

  if (storagePath.endsWith(".zip")) {
    return readFromZip(buffer, filePath)
  }
  return readFromTarGz(buffer, filePath)
}

function readFromZip(buffer, filePath) {
  const yauzl = require("yauzl")
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err)
      let found = false
      zipfile.readEntry()
      zipfile.on("entry", (entry) => {
        if (found) {
          zipfile.readEntry()
          return
        }
        const entryPath = entry.fileName
        if (entryPath === filePath || entryPath === `./${filePath}`) {
          found = true
          zipfile.openReadStream(entry, (err2, readStream) => {
            if (err2) return reject(err2)
            const chunks = []
            readStream.on("data", (chunk) => chunks.push(chunk))
            readStream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
            readStream.on("error", reject)
          })
        } else {
          zipfile.readEntry()
        }
      })
      zipfile.on("end", () => {
        if (!found) resolve("")
      })
      zipfile.on("error", reject)
    })
  })
}

function readFromTarGz(buffer, filePath) {
  const { Readable } = require("stream")
  const { createGunzip } = require("zlib")
  const tar = require("tar")
  return new Promise((resolve, reject) => {
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
    parser.on("end", () => resolve(content))
    parser.on("error", reject)
    Readable.from(buffer).pipe(gunzip).pipe(parser)
  })
}

async function getFileBuffer(submissionId, filePath, userId, role) {
  const submission = await prisma.groupSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      manualDetail: { select: { evidence: true } },
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

  const storagePath = submission.manualDetail?.evidence?.storagePath
  if (!storagePath) throw new AppError("La entrega no tiene archivos", 404, "NOT_FOUND")
  const [buffer] = await bucket.file(storagePath).download()

  if (storagePath.endsWith(".zip")) {
    return extractFileFromZip(buffer, filePath)
  }
  return extractFileFromTarGz(buffer, filePath)
}

function extractFileFromZip(buffer, filePath) {
  const yauzl = require("yauzl")
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zipfile) => {
      if (err) return reject(err)
      let found = false
      zipfile.readEntry()
      zipfile.on("entry", (entry) => {
        if (found) {
          zipfile.readEntry()
          return
        }
        const entryPath = entry.fileName
        if (entryPath === filePath || entryPath === `./${filePath}`) {
          found = true
          zipfile.openReadStream(entry, (err2, readStream) => {
            if (err2) return reject(err2)
            const chunks = []
            readStream.on("data", (chunk) => chunks.push(chunk))
            readStream.on("end", () => resolve(Buffer.concat(chunks)))
            readStream.on("error", reject)
          })
        } else {
          zipfile.readEntry()
        }
      })
      zipfile.on("end", () => {
        if (!found) reject(new NotFoundError("Archivo no encontrado en la entrega"))
      })
      zipfile.on("error", reject)
    })
  })
}

function extractFileFromTarGz(buffer, filePath) {
  const { Readable } = require("stream")
  const { createGunzip } = require("zlib")
  const tar = require("tar")
  return new Promise((resolve, reject) => {
    let found = false
    let result = Buffer.alloc(0)
    const gunzip = createGunzip()
    const parser = new tar.Parser()
    parser.on("entry", (entry) => {
      if (found) {
        entry.resume()
        return
      }
      const entryPath = entry.path
      if (entryPath === filePath || entryPath === `./${filePath}`) {
        found = true
        const chunks = []
        entry.on("data", (chunk) => chunks.push(chunk))
        entry.on("end", () => {
          result = Buffer.concat(chunks)
        })
      } else {
        entry.resume()
      }
    })
    parser.on("end", () => {
      if (!found) return reject(new NotFoundError("Archivo no encontrado en la entrega"))
      resolve(result)
    })
    parser.on("error", reject)
    Readable.from(buffer).pipe(gunzip).pipe(parser)
  })
}

async function getDownloadUrl(submissionId, userId, role) {
  const submission = await prisma.groupSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      manualDetail: { select: { evidence: true } },
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

  const storagePath = submission.manualDetail?.evidence?.storagePath
  if (!storagePath) throw new AppError("La entrega no tiene archivos", 404, "NOT_FOUND")
  const [url] = await bucket.file(storagePath).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  })

  return url
}

async function gradeSubmission(submissionId, teacherUserId, score, feedback) {
  const submission = await prisma.groupSubmission.findUnique({
    where: { id: submissionId },
    include: {
      groupActivity: { select: { id: true, group_id: true, title: true, max_score: true } },
      enrollment: { select: { student_id: true } },
      manualDetail: true,
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

  const passed = score >= 60

  const updated = await prisma.groupSubmission.update({
    where: { id: submissionId },
    data: { score, status: "graded", passed },
  })

  await prisma.submissionManualDetail.upsert({
    where: { submission_id: submissionId },
    update: { feedback: feedback || null, graded_by: teacherUserId, graded_at: new Date() },
    create: {
      submission_id: submissionId,
      evidence: submission.manualDetail?.evidence ?? {},
      feedback: feedback || null,
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
      studentId: submission.enrollment?.student_id,
      score,
      previousStatus: submission.status,
    },
  })

  logger.info({ submissionId, teacherUserId, score }, "Submission graded")
  return {
    id: updated.id,
    status: updated.status,
    score: updated.score,
    feedback: feedback || null,
    gradedAt: new Date().toISOString(),
  }
}

module.exports = {
  createSubmission,
  getSubmission,
  getFileContent,
  getFileBuffer,
  getDownloadUrl,
  gradeSubmission,
}
