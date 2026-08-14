// config/env.js carga dotenv y valida las variables requeridas al boot. Debe
// ser el primer require para que todo lo demas arranque con configuracion
// verificada (JWT_SECRET y DATABASE_URL obligatorios).
const config = require('./config/env');

const app = require('./app');
const prisma = require('../prisma/client');
const logger = require('./lib/logger');

const setupGateway = require('./gateway');
const { startWorker } = require('./services/provisioningWorkerService');

const server = app.listen(config.port, () => {
    logger.info(`Server running at http://localhost:${config.port}`);
});

setupGateway(server);
startWorker();

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    server.close();
    process.exit(0);
});
