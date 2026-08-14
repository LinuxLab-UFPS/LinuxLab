const prisma = require("../../prisma/client")
const { Prisma } = require("@prisma/client")
const { createGroup, syncTeacherGroups, provisionStudentAccount, provisionTeacherAccount, teardownGroup } = require("./containerService")
const logger = require("../lib/logger")

const POLL_INTERVAL = 5000
const BATCH_SIZE = 5
const POOL_SIZE = 3
const CYCLE_TIMEOUT = 90000

let intervalHandle = null
let isRunning = false

/**
 * Las tablas de jobs son un conjunto cerrado de constantes internas (nunca
 * llegan de una peticion), asi que interpolar el nombre como identificador es
 * seguro; el limite y los datos si van parametrizados.
 */
const JOB_TABLES = {
  groups: "group_provisioning_jobs",
  users: "user_provisioning_jobs",
  teardowns: "group_teardown_jobs",
}

async function claimJobs(tableName) {
  return prisma.$queryRaw(
    Prisma.sql`
      UPDATE ${Prisma.raw(tableName)}
      SET status = 'processing', updated_at = NOW()
      WHERE id IN (
        SELECT id FROM (
          SELECT id FROM ${Prisma.raw(tableName)}
          WHERE status = 'pending' AND retries < "maxRetries"
          -- Orden jerarquico: docentes (10) antes que grupos (5) antes que
          -- estudiantes (1). La prioridad vive en el dato, no en el codigo.
          ORDER BY priority DESC, created_at ASC
          LIMIT ${BATCH_SIZE}
          FOR UPDATE SKIP LOCKED
        ) AS picked
      )
      RETURNING *`,
  )
}

async function runPool(items, worker) {
  let index = 0
  const size = Math.min(POOL_SIZE, items.length)
  const runners = Array.from({ length: size }, async () => {
    while (index < items.length) {
      const item = items[index]
      index += 1
      await worker(item)
    }
  })
  await Promise.all(runners)
}

async function processGroupJobs() {
  const jobs = await claimJobs(JOB_TABLES.groups)

  await runPool(jobs, async (job) => {
    try {
      await createGroup(job.teacher_username, job.group_dir, job.group_name)
      // El docente se hace dueno del directorio y entra al grupo Unix. Es
      // idempotente: si el docente aun no esta provisionado, no hace nada y
      // provisionTeacherAccount lo repara cuando lo cree.
      await syncTeacherGroups(job.teacher_username)
      await prisma.groupProvisioningJob.update({
        where: { id: job.id },
        data: { status: "completed" },
      })
      logger.info({ groupDir: job.group_dir }, "Group directory created")
    } catch (err) {
      const newRetries = job.retries + 1
      const newStatus = newRetries >= (job.maxRetries ?? 3) ? "failed" : "pending"
      await prisma.groupProvisioningJob.update({
        where: { id: job.id },
        data: {
          retries: newRetries,
          status: newStatus,
          error: err?.message || String(err),
        },
      })
      logger.error({ err, groupDir: job.group_dir, retries: newRetries }, "Group provisioning failed")
    }
  })
}

async function processUserJobs() {
  const jobs = await claimJobs(JOB_TABLES.users)

  await runPool(jobs, async (job) => {
    try {
      if (job.group_id) {
        await provisionStudentAccount(
          job.user_id,
          job.username,
          job.teacher_username,
          job.group_dir,
          job.group_name,
        )
      } else {
        await provisionTeacherAccount(job.user_id, job.username)
      }
      await prisma.userProvisioningJob.update({
        where: { id: job.id },
        data: { status: "completed" },
      })
      logger.info({ username: job.username }, "User provisioning completed")
    } catch (err) {
      const newRetries = job.retries + 1
      const newStatus = newRetries >= (job.maxRetries ?? 3) ? "failed" : "pending"
      await prisma.userProvisioningJob.update({
        where: { id: job.id },
        data: {
          retries: newRetries,
          status: newStatus,
          error: err?.message || String(err),
        },
      })
      logger.error({ err, username: job.username, retries: newRetries }, "User provisioning failed")
    }
  })
}

async function processTeardownJobs() {
  const jobs = await claimJobs(JOB_TABLES.teardowns)

  await runPool(jobs, async (job) => {
    try {
      let usernames = []
      try {
        usernames = JSON.parse(job.usernames || "[]")
      } catch {
        // un JSON invalido no debe tumbar el teardown: se borra la carpeta igual
      }
      await teardownGroup({
        teacherUsername: job.teacher_username,
        groupDir: job.group_dir,
        groupName: job.group_name,
        usernames,
      })
      await prisma.groupTeardownJob.update({
        where: { id: job.id },
        data: { status: "completed" },
      })
      logger.info({ groupDir: job.group_dir, count: usernames.length }, "Group teardown completed")
    } catch (err) {
      const newRetries = job.retries + 1
      const newStatus = newRetries >= (job.maxRetries ?? 3) ? "failed" : "pending"
      await prisma.groupTeardownJob.update({
        where: { id: job.id },
        data: {
          retries: newRetries,
          status: newStatus,
          error: err?.message || String(err),
        },
      })
      logger.error({ err, groupDir: job.group_dir, retries: newRetries }, "Group teardown failed")
    }
  })
}

async function processPendingJobs() {
  if (isRunning) return
  isRunning = true
  const watchdog = setTimeout(() => {
    logger.error("Provisioning cycle watchdog fired; releasing worker lock")
    isRunning = false
  }, CYCLE_TIMEOUT)
  try {
    await processGroupJobs()
    await processUserJobs()
    await processTeardownJobs()
  } catch (err) {
    logger.error({ err }, "Provisioning worker error")
  } finally {
    clearTimeout(watchdog)
    isRunning = false
  }
}

function startWorker() {
  if (intervalHandle) return
  processPendingJobs()
  intervalHandle = setInterval(processPendingJobs, POLL_INTERVAL)
  logger.info(`Worker started (poll every ${POLL_INTERVAL / 1000}s)`)
}

function stopWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}

module.exports = { startWorker, stopWorker, processPendingJobs }
