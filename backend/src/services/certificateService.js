const crypto = require("crypto")
const prisma = require("../../prisma/client")
const config = require("../config/env")
const logger = require("../lib/logger")
const { NotFoundError } = require("../lib/errors")
const accessService = require("./accessService")
const emailService = require("./emailService")
const { computeGroupSummary } = require("./finalizationService")
const {
  renderStudentCertificate,
  renderInstructorCertificate,
  renderActa,
} = require("../lib/certificatePdf")

/**
 * Codigo publico de verificacion: 24 caracteres url-safe de azar criptografico.
 * Es la unica credencial que la pagina publica y el PDF necesitan.
 */
function generateCode() {
  return crypto.randomBytes(18).toString("base64url")
}

function serializeCertificate(certificate, studentId) {
  return {
    id: certificate.id,
    code: certificate.code,
    studentId: studentId ?? null,
    holderName: certificate.holder_name,
    holderCode: certificate.holder_code,
    groupName: certificate.group_name,
    groupNumber: certificate.group_number,
    teacherName: certificate.teacher_name,
    courseStartedAt: certificate.course_started_at.toISOString(),
    topicsCompleted: certificate.topics_completed,
    topicsTotal: certificate.topics_total,
    definitive: certificate.definitive,
    issuedAt: certificate.issued_at.toISOString(),
  }
}

function serializeInstructorCertificate(certificate) {
  return {
    id: certificate.id,
    code: certificate.code,
    holderName: certificate.holder_name,
    groupName: certificate.group_name,
    groupNumber: certificate.group_number,
    courseStartedAt: certificate.course_started_at.toISOString(),
    studentsCertified: certificate.students_certified,
    studentsTotal: certificate.students_total,
    issuedAt: certificate.issued_at.toISOString(),
  }
}

/**
 * Emite los certificados del grupo al finalizarlo. Corre DENTRO de la
 * transaccion de finalizacion, con el summary evaluado en la misma tx: si
 * algo falla, no queda ni el estado nuevo ni certificados a medias. El del
 * instructor es uno por grupo (group_id es @unique).
 */
async function issueForGroup(tx, { group, summary }) {
  const teacherName = group.teacher.user.name
  const certificates = []

  for (const s of summary.students) {
    if (!s.eligible) continue
    certificates.push(
      await tx.certificate.create({
        data: {
          code: generateCode(),
          enrollment_id: s.enrollmentId,
          holder_name: s.name,
          holder_code: s.code,
          group_name: group.name,
          group_number: group.group_number,
          teacher_name: teacherName,
          course_started_at: group.created_at,
          topics_completed: s.topicsCompleted,
          topics_total: s.topicsTotal,
          definitive: s.definitive ?? 0,
        },
      }),
    )
  }

  const instructorCertificate = await tx.instructorCertificate.create({
    data: {
      code: generateCode(),
      group_id: group.id,
      holder_name: teacherName,
      group_name: group.name,
      group_number: group.group_number,
      course_started_at: group.created_at,
      students_certified: certificates.length,
      students_total: summary.students.length,
    },
  })

  return { certificates, instructorCertificate }
}

/** Certificados emitidos de un grupo, para la vista del docente. */
async function listByGroup({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })

  const [certificates, instructorCertificate] = await Promise.all([
    prisma.certificate.findMany({
      where: { enrollment: { group_id: groupId } },
      include: { enrollment: { select: { student: { select: { user: { select: { id: true } } } } } } },
      orderBy: { issued_at: "asc" },
    }),
    prisma.instructorCertificate.findUnique({ where: { group_id: groupId } }),
  ])

  return {
    certificates: certificates.map((c) =>
      serializeCertificate(c, c.enrollment.student.user.id),
    ),
    instructorCertificate: instructorCertificate
      ? serializeInstructorCertificate(instructorCertificate)
      : null,
  }
}

/** Los certificados del usuario: los que gano como estudiante y los de los grupos que dirige. */
async function listMine(userId) {
  const [certificates, instructorCertificates] = await Promise.all([
    prisma.certificate.findMany({
      where: { enrollment: { student_id: userId } },
      orderBy: { issued_at: "desc" },
    }),
    prisma.instructorCertificate.findMany({
      where: { group: { teacher_id: userId } },
      orderBy: { issued_at: "desc" },
    }),
  ])

  return {
    student: certificates.map((c) => serializeCertificate(c)),
    instructor: instructorCertificates.map(serializeInstructorCertificate),
  }
}

/**
 * Resolucion publica por codigo. La unica bifurcacion entre las dos tablas:
 * primero el certificado de estudiante, luego el de instructor.
 */
async function resolveByCode(code) {
  const certificate = await prisma.certificate.findUnique({ where: { code } })
  if (certificate) {
    return { role: "student", certificate: serializeCertificate(certificate) }
  }
  const instructor = await prisma.instructorCertificate.findUnique({ where: { code } })
  if (instructor) {
    return { role: "instructor", certificate: serializeInstructorCertificate(instructor) }
  }
  throw new NotFoundError("Certificado no encontrado")
}

function withVerificationUrl(serialized) {
  return {
    ...serialized,
    verificationUrl: `${config.frontendUrl}/verificar/${serialized.code}`,
  }
}

/** PDF de un certificado por codigo, para descargarlo de nuevo. */
async function pdfByCode(code) {
  const resolved = await resolveByCode(code)
  const data = withVerificationUrl(resolved.certificate)
  const buffer =
    resolved.role === "student"
      ? await renderStudentCertificate(data)
      : await renderInstructorCertificate(data)
  return { buffer, filename: `certificado-${code}.pdf` }
}

/**
 * Acta del grupo. Tras finalizar los datos academicos quedan congelados (no
 * hay mas intentos), asi que recalcular el summary reproduce las cifras que
 * fundaron la emision; los certificados aportan nombre/codigo congelados.
 * No verifica acceso: la usa el endpoint del docente y el job de correo.
 */
async function buildActa(group) {
  const [summary, certificates, instructorCertificate] = await Promise.all([
    computeGroupSummary(group),
    prisma.certificate.findMany({ where: { enrollment: { group_id: group.id } } }),
    prisma.instructorCertificate.findUnique({ where: { group_id: group.id } }),
  ])
  const byEnrollment = new Map(certificates.map((c) => [c.enrollment_id, c]))

  const rows = summary.students.map((s) => {
    const c = byEnrollment.get(s.enrollmentId)
    return {
      name: c?.holder_name ?? s.name,
      code: c?.holder_code ?? s.code,
      topicsCompleted: c?.topics_completed ?? s.topicsCompleted,
      topicsTotal: c?.topics_total ?? s.topicsTotal,
      definitive: c?.definitive ?? s.definitive,
      certified: Boolean(c),
      verificationCode: c?.code ?? null,
    }
  })

  const buffer = await renderActa({
    groupName: group.name,
    groupNumber: group.group_number,
    teacherName: group.teacher.user.name,
    finishedAt: instructorCertificate?.issued_at ?? group.updated_at,
    rows,
  })
  return { buffer, instructorCertificate }
}

async function actaPdf({ groupId, teacherUserId, role }) {
  await accessService.ensureGroupAccess({ groupId, teacherUserId, role })
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { teacher: { select: { user: { select: { name: true } } } } },
  })
  const { buffer } = await buildActa(group)
  return { buffer, filename: `acta-${group.name.replace(/[^\w-]+/g, "-")}.pdf` }
}

/**
 * Entrega por correo de un job certificate_email. Dos formas de payload:
 *   { kind: "student", code, email }  -> certificado del estudiante adjunto
 *   { kind: "teacher", groupId }      -> acta + certificado de instructor
 * El PDF se genera al vuelo desde las columnas congeladas: el correo puede
 * reintentarse sin que el documento cambie.
 */
async function deliverJob(payload) {
  if (payload?.kind === "student") {
    const resolved = await resolveByCode(payload.code)
    if (resolved.role !== "student") {
      throw new NotFoundError("El código no corresponde a un certificado de estudiante")
    }
    const data = withVerificationUrl(resolved.certificate)
    const buffer = await renderStudentCertificate(data)
    const { subject, html, text } = emailService.renderStudentCertificateEmail({
      holderName: data.holderName,
      groupName: data.groupName,
      verificationUrl: data.verificationUrl,
      loginUrl: `${config.frontendUrl}/login`,
    })
    await emailService.sendMail({
      to: payload.email,
      subject,
      html,
      text,
      category: "certificate",
      attachments: [{ filename: `certificado-${data.code}.pdf`, content: buffer }],
    })
    return
  }

  if (payload?.kind === "teacher") {
    const group = await prisma.group.findUnique({
      where: { id: payload.groupId },
      include: { teacher: { include: { user: { select: { id: true, email: true, name: true } } } } },
    })
    if (!group) throw new NotFoundError("Grupo no encontrado para el acta")
    const { buffer: actaBuffer, instructorCertificate } = await buildActa(group)
    const instructorData = instructorCertificate
      ? withVerificationUrl(serializeInstructorCertificate(instructorCertificate))
      : null
    const instructorBuffer = instructorData
      ? await renderInstructorCertificate(instructorData)
      : null
    const { subject, html, text } = emailService.renderTeacherFinalizationEmail({
      teacherName: group.teacher.user.name,
      groupName: group.name,
      studentsCertified: instructorCertificate?.students_certified ?? 0,
      studentsTotal: instructorCertificate?.students_total ?? 0,
      verificationUrl: instructorData?.verificationUrl ?? `${config.frontendUrl}`,
    })
    const attachments = [{ filename: `acta-${group.name.replace(/[^\w-]+/g, "-")}.pdf`, content: actaBuffer }]
    if (instructorBuffer) {
      attachments.push({ filename: `certificado-instructor-${instructorData.code}.pdf`, content: instructorBuffer })
    }
    await emailService.sendMail({
      to: group.teacher.user.email,
      subject,
      html,
      text,
      category: "certificate",
      attachments,
    })
    return
  }

  throw new Error(`Payload de certificate_email no reconocido: ${JSON.stringify(payload).slice(0, 120)}`)
}

module.exports = {
  issueForGroup,
  listByGroup,
  listMine,
  resolveByCode,
  pdfByCode,
  actaPdf,
  deliverJob,
}
