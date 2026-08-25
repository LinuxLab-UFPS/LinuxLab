const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const config = require('../src/config/env');

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// The externally-provided pg Pool is not closed by Prisma's $disconnect(), so
// seed scripts (and the server on shutdown) would hang on an open socket.
// Closing it here lets the process exit once disconnect resolves.
const _disconnect = prisma.$disconnect.bind(prisma);
prisma.$disconnect = async () => {
  await _disconnect();
  await pool.end().catch(() => {});
};

module.exports = prisma;
