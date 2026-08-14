// config/env.js carga dotenv y valida las variables requeridas al boot. Debe
// ser el primer require para que todo lo demas arranque con configuracion
// verificada (JWT_SECRET y DATABASE_URL obligatorios).
const config = require('./config/env');

const app = require('./app');
const prisma = require('../prisma/client');
const logger = require('./lib/logger');

const setupGateway = require('./gateway');
const { startWorker, stopWorker } = require('./services/provisioningWorkerService');

const server = app.listen(config.port, () => {
    logger.info(`Server running at http://localhost:${config.port}`);
});

const closeGateway = setupGateway(server);
startWorker();

let shuttingDown = false;
async function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down');
    try {
        closeGateway();
        stopWorker();
        server.close();
        await prisma.$disconnect();
        process.exit(0);
    } catch (err) {
        logger.error({ err }, 'Error during shutdown');
        process.exit(1);
    }
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Un rechazo sin cazar o una excepcion no capturada no deben dejar el proceso
// en un estado desconocido: se registran y se apaga de forma ordenada.
process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
    shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    shutdown('uncaughtException');
});
