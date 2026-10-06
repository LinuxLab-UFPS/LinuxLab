const prisma = require("../../prisma/client")
const { AppError, ConflictError, NotFoundError } = require("../lib/errors")
const { runInTransaction } = require("../lib/transaction")
const { parseOrThrow } = require("../dtos/common")
const { createTeacherRequestSchema, serializeTeacherRequest } = require("../dtos/teacherRequestDtos")
const userService = require("./userService")
const authService = require("./authService")
const auditService = require("./auditService")
const logger = require("../lib/logger")

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Solicitudes de cuenta docente. Quien es docente en la universidad llena el
 * formulario publico; el admin la aprueba desde /admin/docentes y la
 * aprobacion es el mismo registro que hace el admin a mano (userService.register
 * + la invitacion para configurar la cuenta), asi que no hay un segundo camino
 * para crear docentes.
 */
async function create(input) {
  const parsed = parseOrThrow(createTeacherRequestSchema, input)

  const [existingUser, pending] = await Promise.all([
    prisma.user.findUnique({ where: { email: parsed.email }, include: { teacher: true } }),
    prisma.teacherRequest.findFirst({ where: { email: parsed.email, status: "pending" } }),
  ])
  if (existingUser?.teacher || existingUser?.role === "admin") {
    throw new ConflictError("Este correo ya tiene una cuenta docente. Inicie sesión con él.")
  }
  // Una cuenta de estudiante no pide ser docente desde aqui: corta la broma de
  // que cada estudiante llene el formulario con su propio correo. Un docente
  // real que se registro como estudiante por error lo resuelve el admin.
  if (existingUser?.student) {
    throw new ConflictError(
      "Este correo pertenece a una cuenta de estudiante. Si es docente, comuníquese con el administrador.",
    )
  }
  if (pending) {
    throw new ConflictError("Ya hay una solicitud en revisión con este correo.")
  }

  const request = await prisma.teacherRequest.create({
    data: {
      name: parsed.name,
      email: parsed.email,
      code: parsed.code,
    },
  })
  logger.info({ requestId: request.id, email: request.email }, "Teacher request created")
  return serializeTeacherRequest(request)
}

async function list({ status = "pending" } = {}) {
  const where = ["pending", "approved", "rejected"].includes(status) ? { status } : {}
  const rows = await prisma.teacherRequest.findMany({ where, orderBy: { created_at: "asc" } })
  return rows.map(serializeTeacherRequest)
}

async function pendingCount() {
  return prisma.teacherRequest.count({ where: { status: "pending" } })
}

/** Toma la solicitud pendiente bajo lock: dos admins no la resuelven a la vez. */
async function lockPending(tx, id) {
  if (!UUID_REGEX.test(id)) throw new NotFoundError("Solicitud no encontrada")
  await tx.$queryRaw`SELECT id FROM "TeacherRequest" WHERE id = ${id}::uuid FOR UPDATE`
  const request = await tx.teacherRequest.findUnique({ where: { id } })
  if (!request) throw new NotFoundError("Solicitud no encontrada")
  if (request.status !== "pending") {
    throw new AppError("La solicitud ya fue revisada", 409, "CONFLICT")
  }
  return request
}

async function approve({ id, adminUserId, meta = {} }) {
  const { request, teacher } = await runInTransaction(async (tx) => {
    const request = await lockPending(tx, id)
    const teacher = await userService.register({
      name: request.name,
      email: request.email,
      code: request.code,
      tx,
    })
    await tx.teacherRequest.update({
      where: { id },
      data: { status: "approved", reviewed_by: adminUserId, reviewed_at: new Date() },
    })
    return { request, teacher }
  })

  auditService.audit({
    userId: adminUserId,
    eventType: "teacher_request_approved",
    target: request.email,
    metadata: { requestId: id, teacherId: teacher.id, name: request.name },
    ...meta,
  })

  // Igual que el registro manual: si la invitacion falla, el docente ya existe
  // y el admin puede reenviarla desde la tabla.
  let debugLink
  try {
    ;({ debugLink } = await authService.inviteTeacher({ email: teacher.email, name: teacher.name }))
  } catch (err) {
    logger.error({ err, email: teacher.email }, "No se pudo enviar la invitación de la solicitud aprobada")
  }
  return { teacher, debugLink }
}

async function reject({ id, adminUserId, meta = {} }) {
  const request = await runInTransaction(async (tx) => {
    const request = await lockPending(tx, id)
    await tx.teacherRequest.update({
      where: { id },
      data: { status: "rejected", reviewed_by: adminUserId, reviewed_at: new Date() },
    })
    return request
  })
  auditService.audit({
    userId: adminUserId,
    eventType: "teacher_request_rejected",
    target: request.email,
    metadata: { requestId: id, name: request.name },
    ...meta,
  })
  return serializeTeacherRequest({ ...request, status: "rejected" })
}

module.exports = { create, list, pendingCount, approve, reject }
