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
// Un cliente inactivo emite 'error' cuando la base se reinicia o corta la
// conexion. Sin este manejador, node lo trata como excepcion no capturada y
// tumba el proceso: un reinicio de un segundo de Postgres dejaba el backend
// muerto hasta que alguien lo reiniciaba a mano. El pool descarta el cliente
// roto y abre otro en la siguiente consulta, asi que basta con registrarlo.
pool.on('error', (err) => {
  console.error('[db] cliente inactivo perdido, el pool lo repondra:', err.message);
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
