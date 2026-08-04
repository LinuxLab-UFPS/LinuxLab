const prisma = require("../../prisma/client")
const { createGroup, provisionStudentAccount, provisionTeacherAccount, teardownGroup } = require("./linuxContainerService")
const logger = require("../lib/logger")

const POLL_INTERVAL = 5000
const BATCH_SIZE = 5
const POOL_SIZE = 3
const CYCLE_TIMEOUT = 90000

let intervalHandle = null
let isRunning = false

async function claimJobs(tableName) {
  return prisma.$queryRawUnsafe(
    `UPDATE ${tableName}
     SET status = 'processing', updated_at = NOW()
     WHERE id IN (
       SELECT id FROM (
         SELECT id FROM ${tableName}
         WHERE status = 'pending' AND retries < "maxRetries"
         ORDER BY created_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED
       ) AS picked
     )
     RETURNING *`,
    BATCH_SIZE,
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
  const jobs = await claimJobs("group_provisioning_jobs")

  await runPool(jobs, async (job) => {
    try {
      await createGroup(job.teacher_username, job.group_dir, job.group_name)
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
  const jobs = await claimJobs("user_provisioning_jobs")

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
  const jobs = await claimJobs("group_teardown_jobs")

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
