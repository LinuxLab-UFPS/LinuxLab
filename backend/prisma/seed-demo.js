/**
 * Seed demo SOLO para la sesion de captura de vistas (anexos).
 *
 * Idempotente: se puede correr las veces que haga falta. Crea un curso
 * completo (admin, docentes, estudiantes, grupos, matricula, actividades,
 * intentos, entrega calificada, bitacora y un grupo finalizado con
 * certificados) para que ninguna vista de los SRS salga vacia.
 *
 * Uso (dentro del contenedor backend, con DATABASE_URL local):
 *   node prisma/seed-demo.js
 */

const { PrismaClient } = require("@prisma/client")
const { PrismaPg } = require("@prisma/adapter-pg")
const { Pool } = require("pg")
const crypto = require("crypto")

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

const AI = { admin: "admin", teacher: "teacher", student: "student" }

function token() {
  return crypto.randomBytes(24).toString("hex")
}

function groupDirOf(groupNumber) {
  return `G-${String(groupNumber).padStart(4, "0")}`
}

function groupNameOf(groupId) {
  return `grp_${groupId.replace(/-/g, "").substring(0, 8)}`
}

function workdirOf(type, number) {
  return `${type === "quiz" ? "Q" : "T"}-${String(number).padStart(4, "0")}`
}

async function upsertUser({ email, name, role, code, username }) {
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, role, active: true },
    create: { email, name, role, active: true },
  })

  if (role === AI.student) {
    await prisma.student.upsert({
      where: { user_id: user.id },
      update: { code },
      create: { user_id: user.id, code },
    })
  }
  if (role === AI.teacher) {
    await prisma.teacher.upsert({
      where: { user_id: user.id },
      update: { code },
      create: { user_id: user.id, code },
    })
  }

  await prisma.settings.upsert({
    where: { user_id: user.id },
    update: {},
    create: { user_id: user.id, terminal_font_size: 16, theme: "dark" },
  })

  await prisma.linuxAccount.upsert({
    where: { user_id: user.id },
    update: { linux_username: username },
    create: { user_id: user.id, linux_username: username, linux_provisioned: true },
  })

  return user
}

async function upsertGroup({ groupNumber, name, description, teacherId, status }) {
  const group = await prisma.group.upsert({
    where: { group_number: groupNumber },
    update: { name, description, teacher_id: teacherId, status },
    create: {
      group_number: groupNumber,
      name,
      description,
      teacher_id: teacherId,
      status,
      group_dir: groupDirOf(groupNumber),
      invite_token: token(),
    },
  })
  if (!group.group_dir) {
    return prisma.group.update({
      where: { id: group.id },
      data: { group_dir: groupDirOf(groupNumber), invite_token: group.invite_token ?? token() },
    })
  }
  return group
}

async function enroll(studentId, groupId) {
  return prisma.enrollment.upsert({
    where: { student_id_group_id: { student_id: studentId, group_id: groupId } },
    update: { status: "active" },
    create: { student_id: studentId, group_id: groupId, status: "active" },
  })
}

async function createBankActivity(group, topicActivity, { type = "workshop", evaluation = "automatic" } = {}) {
  const existing = await prisma.groupActivity.findFirst({
    where: { group_id: group.id, title: topicActivity.title },
  })
  if (existing) return existing

  const created = await prisma.groupActivity.create({
    data: {
      group_id: group.id,
      title: topicActivity.title,
      instructions: topicActivity.instructions,
      difficulty: topicActivity.difficulty,
      activity_type: type,
      evaluation_type: evaluation,
      max_score: 100,
      setup: topicActivity.setup ?? undefined,
      checks: evaluation === "automatic" ? topicActivity.checks : [],
      attempt_limit: type === "quiz" ? 3 : null,
      topic_number: topicActivity.topic?.order_number ?? null,
      required: true,
      enabled: true,
      due_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      workdir: "pending",
    },
  })
  return prisma.groupActivity.update({
    where: { id: created.id },
    data: { workdir: workdirOf(type, created.activity_number) },
  })
}

async function manualActivity(group, number, title) {
  const existing = await prisma.groupActivity.findFirst({
    where: { group_id: group.id, title },
  })
  if (existing) return existing
  const created = await prisma.groupActivity.create({
    data: {
      group_id: group.id,
      title,
      instructions: "Adjunta la evidencia de la practica y una breve reflexion.",
      difficulty: "intermediate",
      activity_type: "workshop",
      evaluation_type: "manual",
      max_score: 100,
      checks: [],
      topic_number: number,
      required: true,
      enabled: true,
      due_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      workdir: "pending",
    },
  })
  return prisma.groupActivity.update({
    where: { id: created.id },
    data: { workdir: workdirOf("workshop", created.activity_number) },
  })
}

async function audit(userId, userRole, eventType, message, groupId = null) {
  const exists = await prisma.auditEvent.findFirst({
    where: { user_id: userId, event_type: eventType, message },
  })
  if (exists) return exists
  return prisma.auditEvent.create({
    data: { user_id: userId, user_role: userRole, event_type: eventType, message, group_id: groupId },
  })
}

async function main() {
  console.log("Sembrando datos demo...")

  const admin = await upsertUser({
    email: "admin@ufps.edu.co",
    name: "Administrador LinuxLab",
    role: AI.admin,
    username: "admin",
  })

  const ana = await upsertUser({
    email: "ana.torres@ufps.edu.co",
    name: "Ana Torres",
    role: AI.teacher,
    code: "D-1001",
    username: "docente-ana",
  })
  const luis = await upsertUser({
    email: "luis.gomez@ufps.edu.co",
    name: "Luis Gomez",
    role: AI.teacher,
    code: "D-1002",
    username: "docente-luis",
  })

  const students = []
  const names = [
    "Sofia Ramirez",
    "Camila Duarte",
    "Andres Pena",
    "Valentina Ruiz",
    "Mateo Herrera",
    "Laura Castillo",
  ]
  for (let i = 0; i < names.length; i += 1) {
    students.push(
      await upsertUser({
        email: `estudiante${i + 1}@ufps.edu.co`,
        name: names[i],
        role: AI.student,
        code: `115000${i + 1}`,
        username: `est-${names[i].split(" ")[0].toLowerCase()}`,
      }),
    )
  }

  // Grupos: dos activos (uno por docente) y uno finalizado para certificados.
  const groupAna = await upsertGroup({
    groupNumber: 9001,
    name: "Sistemas Operativos - Grupo A",
    description: "Grupo demo del curso de Sistemas Operativos (manana).",
    teacherId: ana.id,
    status: "active",
  })
  const groupLuis = await upsertGroup({
    groupNumber: 9002,
    name: "Sistemas Operativos - Grupo B",
    description: "Grupo demo del curso de Sistemas Operativos (tarde).",
    teacherId: luis.id,
    status: "active",
  })
  const groupFinished = await upsertGroup({
    groupNumber: 9003,
    name: "Sistemas Operativos - Cohorte 2026-1",
    description: "Grupo demo finalizado, con certificados emitidos.",
    teacherId: ana.id,
    status: "finished",
  })

  const enrollAna = []
  for (const s of students.slice(0, 4)) enrollAna.push(await enroll(s.id, groupAna.id))
  const enrollLuis = []
  for (const s of students.slice(4)) enrollLuis.push(await enroll(s.id, groupLuis.id))

  // Avance de temario en el grupo A: progreso e intentos de comprobaciones.
  const topics = await prisma.topic.findMany({ orderBy: { order_number: "asc" }, take: 4 })
  const bank = await prisma.topicActivity.findMany({
    orderBy: { created_at: "asc" },
    take: 4,
    include: { topic: true },
  })

  for (let i = 0; i < enrollAna.length; i += 1) {
    for (const topic of topics.slice(0, 3 - (i % 2))) {
      await prisma.topicProgress.upsert({
        where: { enrollment_id_topic_id: { enrollment_id: enrollAna[i].id, topic_id: topic.id } },
        update: { completed: true, completed_at: new Date() },
        create: {
          enrollment_id: enrollAna[i].id,
          topic_id: topic.id,
          completed: true,
          completed_at: new Date(),
        },
      })
    }
    for (const ta of bank.slice(0, 2)) {
      const exists = await prisma.topicSubmission.findFirst({
        where: { enrollment_id: enrollAna[i].id, topic_activity_id: ta.id },
      })
      if (!exists) {
        await prisma.topicSubmission.create({
          data: {
            enrollment_id: enrollAna[i].id,
            topic_activity_id: ta.id,
            attempt_number: 1,
            score: 80 + i * 5,
            passed: true,
            auto_results: [{ check: "demo", passed: true }],
          },
        })
      }
    }
  }

  // Actividades de grupo: del banco (automaticas) y una manual calificada.
  const gaAuto1 = await createBankActivity(groupAna, bank[0], { type: "workshop" })
  const gaAuto2 = await createBankActivity(groupAna, bank[1], { type: "quiz" })
  const gaManual = await manualActivity(groupAna, topics[0]?.order_number ?? 1, "Informe de practica: entorno Linux")
  await createBankActivity(groupLuis, bank[2] ?? bank[0], { type: "workshop" })

  // Entrega manual calificada del primer estudiante del grupo A.
  if (enrollAna[0]) {
    const existing = await prisma.groupSubmission.findFirst({
      where: { enrollment_id: enrollAna[0].id, group_activity_id: gaManual.id },
    })
    if (!existing) {
      const submission = await prisma.groupSubmission.create({
        data: {
          enrollment_id: enrollAna[0].id,
          group_activity_id: gaManual.id,
          attempt_number: 1,
          status: "graded",
          score: 88,
          passed: true,
        },
      })
      await prisma.submissionManualDetail.create({
        data: {
          submission_id: submission.id,
          evidence: [{ file: "informe.pdf", size: 102400 }],
          feedback: "Buen trabajo: el informe cubre los comandos y justifica cada paso.",
          graded_by: ana.id,
          graded_at: new Date(),
        },
      })
    }

    // Un intento automatico con detalle, para las vistas de actividad automatica.
    const autoExisting = await prisma.groupSubmission.findFirst({
      where: { enrollment_id: enrollAna[0].id, group_activity_id: gaAuto1.id },
    })
    if (!autoExisting) {
      const autoSub = await prisma.groupSubmission.create({
        data: {
          enrollment_id: enrollAna[0].id,
          group_activity_id: gaAuto1.id,
          attempt_number: 1,
          status: "submitted",
          score: 75,
          passed: true,
        },
      })
      await prisma.submissionAutoDetail.create({
        data: {
          submission_id: autoSub.id,
          auto_results: [
            { name: "El directorio existe", passed: true, score: 40 },
            { name: "Permisos correctos", passed: true, score: 35 },
          ],
        },
      })
    }
  }

  // Bitacora demo (grupo A).
  await audit(ana.id, AI.teacher, "group_created", "Grupo creado: Sistemas Operativos - Grupo A", groupAna.id)
  await audit(ana.id, AI.teacher, "activity_created", `Actividad creada: ${gaAuto1.title}`, groupAna.id)
  await audit(ana.id, AI.teacher, "activity_graded", "Entrega calificada de Sofia Ramirez", groupAna.id)
  await audit(students[0].id, AI.student, "auth_login", "Inicio de sesion del estudiante", groupAna.id)
  await audit(admin.id, AI.admin, "teacher_registered", "Docente registrado: Ana Torres")

  // Grupo finalizado: matricula, certificados de estudiante e instructor.
  const enrollFinished = []
  for (const s of students.slice(0, 3)) enrollFinished.push(await enroll(s.id, groupFinished.id))

  const topicsTotal = topics.length
  for (let i = 0; i < enrollFinished.length; i += 1) {
    const e = enrollFinished[i]
    const code = `CERT-DEMO-${String(i + 1).padStart(3, "0")}`
    await prisma.certificate.upsert({
      where: { enrollment_id: e.id },
      update: {},
      create: {
        code,
        enrollment_id: e.id,
        holder_name: students[i].name,
        holder_code: `115000${i + 1}`,
        group_name: groupFinished.name,
        group_number: groupFinished.group_number,
        teacher_name: ana.name,
        course_started_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        topics_completed: topicsTotal,
        topics_total: topicsTotal,
        definitive: 4.2 + i * 0.1,
      },
    })
  }

  const existingInstructor = await prisma.instructorCertificate.findUnique({
    where: { group_id: groupFinished.id },
  })
  if (!existingInstructor) {
    await prisma.instructorCertificate.create({
      data: {
        code: "CERT-DOC-DEMO-001",
        group_id: groupFinished.id,
        holder_name: ana.name,
        group_name: groupFinished.name,
        group_number: groupFinished.group_number,
        course_started_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        students_certified: enrollFinished.length,
        students_total: enrollFinished.length,
        issued_at: new Date(),
      },
    })
  }

  console.log("Seed demo completado.")
  console.log(`  admin:        admin@ufps.edu.co`)
  console.log(`  docente:      ana.torres@ufps.edu.co (grupo A, activo)`)
  console.log(`  docente:      luis.gomez@ufps.edu.co (grupo B, activo)`)
  console.log(`  estudiante:   estudiante1@ufps.edu.co (grupo A, con entrega)`)
  console.log(`  certificado:  CERT-DEMO-001`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
