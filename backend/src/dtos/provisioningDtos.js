/** Job de aprovisionamiento de un estudiante, para el listado por grupo. */
function serializeGroupUserJob(job) {
  return {
    id: job.id,
    username: job.username,
    status: job.status,
    retries: job.retries,
    error: job.error,
    student: {
      name: job.user.name,
      email: job.user.email,
      code: job.user.code ?? null,
    },
    createdAt: job.created_at,
  }
}

/** Job de aprovisionamiento de un docente, para el listado de admin. */
function serializeTeacherUserJob(job) {
  return {
    id: job.id,
    username: job.username,
    status: job.status,
    retries: job.retries,
    error: job.error,
    teacher: {
      name: job.user.name,
      email: job.user.email,
    },
    createdAt: job.created_at,
  }
}

module.exports = { serializeGroupUserJob, serializeTeacherUserJob }
