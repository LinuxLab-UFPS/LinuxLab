const prisma = require("../../prisma/client")

const DEFAULT_TX_OPTIONS = {
  maxWait: 10000,
  timeout: 30000,
}

function runInTransaction(work, options) {
  return prisma.$transaction((tx) => work(tx), {
    ...DEFAULT_TX_OPTIONS,
    ...options,
  })
}

module.exports = { runInTransaction }
