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

process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason }, 'Unhandled promise rejection');
    shutdown('unhandledRejection');
});
process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception');
    shutdown('uncaughtException');
});
