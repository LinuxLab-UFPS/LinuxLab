const prisma = require("../../prisma/client")
const { provisionLinuxAccount } = require("./enrollmentService")

const POLL_INTERVAL = 5000
const BATCH_SIZE = 5
const MAX_RETRIES = 3

let intervalHandle = null

async function processPendingJobs() {
  try {
    const jobs = await prisma.$queryRawUnsafe(
      `SELECT * FROM provisioning_jobs
       WHERE status = 'pending' AND retries < $1
       ORDER BY created_at ASC
       LIMIT $2
       FOR UPDATE SKIP LOCKED`,
      MAX_RETRIES,
      BATCH_SIZE,
    )

    for (const job of jobs) {
      await prisma.provisioningJob.update({
        where: { id: job.id },
        data: { status: "processing" },
      })

      try {
        await provisionLinuxAccount(job.user_id, job.username)
        await prisma.provisioningJob.update({
          where: { id: job.id },
          data: { status: "completed" },
        })
        console.log(`[PROVISIONING] ${job.username} completed`)
      } catch (err) {
        const newRetries = job.retries + 1
        const newStatus = newRetries >= (job.max_retries || MAX_RETRIES) ? "failed" : "pending"
        await prisma.provisioningJob.update({
          where: { id: job.id },
          data: {
            retries: newRetries,
            status: newStatus,
            error: err?.message || String(err),
          },
        })
        console.error(`[PROVISIONING] ${job.username} failed (${newRetries}/${MAX_RETRIES}): ${err?.message || err}`)
      }
    }
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
