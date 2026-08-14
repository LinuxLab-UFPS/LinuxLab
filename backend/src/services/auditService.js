const prisma = require("../../prisma/client")
const logger = require("../lib/logger")

/** Registra un evento de auditoria; un fallo aqui nunca tumba la operacion. */
async function audit({ userId, groupId, eventType, target, metadata }) {
  try {
    await prisma.activityAuditEvent.create({
      data: {
        user_id: userId,
        group_id: groupId ?? null,
        event_type: eventType,
        target: target ?? null,
        metadata: metadata ?? undefined,
      },
    })
  } catch (err) {
    logger.error({ err, eventType }, "Audit event not recorded")
  }
}

module.exports = { audit }
