const prisma = require("../../prisma/client")
const { Prisma } = require("@prisma/client")
const { createGroup, syncTeacherGroups, provisionStudentAccount, provisionTeacherAccount, teardownGroup } = require("./containerService")
const certificateService = require("./certificateService")
const logger = require("../lib/logger")

const POLL_INTERVAL = 5000
const BATCH_SIZE = 5
const POOL_SIZE = 3
const CYCLE_TIMEOUT = 90000

let intervalHandle = null
let isRunning = false

const JOB_TYPES = ["group_provisioning", "user_provisioning", "group_teardown", "certificate_email"]

async function claimJobs(type) {
  return prisma.$queryRaw(
    Prisma.sql`
      UPDATE "Job"
      SET status = 'processing', updated_at = NOW()
      WHERE id IN (
        SELECT id FROM (
          SELECT id FROM "Job"
          WHERE status = 'pending' AND retries < max_retries AND type = ${type}::"JobType"
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

async function markCompleted(jobId) {
  await prisma.job.update({ where: { id: jobId }, data: { status: "completed" } })
}

async function markFailed(job, err) {
  const newRetries = job.retries + 1
  const newStatus = newRetries >= (job.max_retries ?? 3) ? "failed" : "pending"
  await prisma.job.update({
    where: { id: job.id },
    data: { retries: newRetries, status: newStatus, error: err?.message || String(err) },
  })
  return newRetries
}

async function processGroupJobs() {
  const jobs = await claimJobs("group_provisioning")

  await runPool(jobs, async (job) => {
    const p = job.payload ?? {}
    try {
      await createGroup(p.teacher_username, p.group_dir, p.group_name)
      await syncTeacherGroups(p.teacher_username)
      await markCompleted(job.id)
      logger.info({ groupDir: p.group_dir }, "Group directory created")
    } catch (err) {
      const retries = await markFailed(job, err)
      logger.error({ err, groupDir: p.group_dir, retries }, "Group provisioning failed")
    }
  })
}

async function processUserJobs() {
  const jobs = await claimJobs("user_provisioning")

  await runPool(jobs, async (job) => {
    const p = job.payload ?? {}
    try {
      if (p.group_id || p.group_dir) {
        await provisionStudentAccount(job.user_id, p.username, p.teacher_username, p.group_dir, p.group_name)
      } else {
        await provisionTeacherAccount(job.user_id, p.username)
      }
      await markCompleted(job.id)
      logger.info({ username: p.username }, "User provisioning completed")
    } catch (err) {
      const retries = await markFailed(job, err)
      logger.error({ err, username: p.username, retries }, "User provisioning failed")
    }
  })
}

async function processTeardownJobs() {
  const jobs = await claimJobs("group_teardown")

  await runPool(jobs, async (job) => {
    const p = job.payload ?? {}
    const usernames = Array.isArray(p.usernames) ? p.usernames : []
    try {
      await teardownGroup({
        teacherUsername: p.teacher_username,
        groupDir: p.group_dir,
        groupName: p.group_name,
        usernames,
      })
      await markCompleted(job.id)
      logger.info({ groupDir: p.group_dir, count: usernames.length }, "Group teardown completed")
    } catch (err) {
      const retries = await markFailed(job, err)
      logger.error({ err, groupDir: p.group_dir, retries }, "Group teardown failed")
    }
  })
}

async function processCertificateJobs() {
  const jobs = await claimJobs("certificate_email")

  await runPool(jobs, async (job) => {
    try {
      await certificateService.deliverJob(job.payload)
      await markCompleted(job.id)
      logger.info({ jobId: job.id, kind: job.payload?.kind }, "Certificate email sent")
    } catch (err) {
      const retries = await markFailed(job, err)
      logger.error({ err, jobId: job.id, retries }, "Certificate email failed")
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
    await processCertificateJobs()
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
