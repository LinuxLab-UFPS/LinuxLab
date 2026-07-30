const prisma = require("../../prisma/client")
const { createGroup, provisionStudentAccount, provisionTeacherAccount } = require("./linuxContainerService")

const POLL_INTERVAL = 5000
const BATCH_SIZE = 5
const MAX_RETRIES = 3

let intervalHandle = null

async function processGroupJobs() {
  const jobs = await prisma.$queryRawUnsafe(
    `SELECT * FROM group_provisioning_jobs
     WHERE status = 'pending' AND retries < $1
     ORDER BY created_at ASC
     LIMIT $2
     FOR UPDATE SKIP LOCKED`,
    MAX_RETRIES,
    BATCH_SIZE,
  )

  for (const job of jobs) {
    await prisma.groupProvisioningJob.update({
      where: { id: job.id },
      data: { status: "processing" },
    })

    try {
      await createGroup(job.teacher_username, job.group_dir, job.group_name)
      await prisma.groupProvisioningJob.update({
        where: { id: job.id },
        data: { status: "completed" },
      })
      console.log(`[PROVISIONING] Group ${job.group_dir} created`)
    } catch (err) {
      const newRetries = job.retries + 1
      const newStatus = newRetries >= MAX_RETRIES ? "failed" : "pending"
      await prisma.groupProvisioningJob.update({
        where: { id: job.id },
        data: {
          retries: newRetries,
          status: newStatus,
          error: err?.message || String(err),
        },
      })
      console.error(`[PROVISIONING] Group ${job.group_dir} failed (${newRetries}/${MAX_RETRIES}): ${err?.message || err}`)
    }
  }
}

async function processUserJobs() {
  const jobs = await prisma.$queryRawUnsafe(
    `SELECT * FROM user_provisioning_jobs
     WHERE status = 'pending' AND retries < $1
     ORDER BY created_at ASC
     LIMIT $2
     FOR UPDATE SKIP LOCKED`,
    MAX_RETRIES,
    BATCH_SIZE,
  )

  for (const job of jobs) {
    await prisma.userProvisioningJob.update({
      where: { id: job.id },
      data: { status: "processing" },
    })

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
      console.log(`[PROVISIONING] User ${job.username} completed`)
    } catch (err) {
      const newRetries = job.retries + 1
      const newStatus = newRetries >= MAX_RETRIES ? "failed" : "pending"
      await prisma.userProvisioningJob.update({
        where: { id: job.id },
        data: {
          retries: newRetries,
          status: newStatus,
          error: err?.message || String(err),
        },
      })
      console.error(`[PROVISIONING] User ${job.username} failed (${newRetries}/${MAX_RETRIES}): ${err?.message || err}`)
    }
  }
}

async function processPendingJobs() {
  try {
    await processGroupJobs()
    await processUserJobs()
  } catch (err) {
    console.error("[PROVISIONING] Worker error:", err?.message || err)
  }
}

function startWorker() {
  if (intervalHandle) return
  processPendingJobs()
  intervalHandle = setInterval(processPendingJobs, POLL_INTERVAL)
  console.log(`[PROVISIONING] Worker started (poll every ${POLL_INTERVAL / 1000}s)`)
}

function stopWorker() {
  if (intervalHandle) {
    clearInterval(intervalHandle)
    intervalHandle = null
  }
}

module.exports = { startWorker, stopWorker, processPendingJobs }
