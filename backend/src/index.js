// config/env.js carga dotenv y valida las variables requeridas al boot. Debe
// ser el primer require para que todo lo demas arranque con configuracion
// verificada (JWT_SECRET y DATABASE_URL obligatorios).
const config = require('./config/env');

const express = require('express');
const { randomUUID } = require('crypto');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const prisma = require('../prisma/client');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');
const preferencesRoutes = require('./routes/preferences');
const terminalRoutes = require('./routes/terminal');
const activityRoutes = require('./routes/activities');
const groupActivityRoutes = require('./routes/groupActivities');
const logger = require('./lib/logger');
const errorHandler = require('./middleware/errorHandler');

const setupGateway = require('./gateway');
const { startWorker } = require('./services/provisioningWorker');

const app = express();

// CORS restringido a origenes explicitos (CORS_ORIGIN, separados por coma).
// Con el navegador en el mismo origen (proxy por path) CORS no interviene;
// con subdominios, aqui se lista el del frontend. Las peticiones sin Origin
// (curl, server-side) se permiten.
app.use(cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
}));

app.use(morgan('[:date[clf]] [:method] :url :status :res[content-length] - :response-time ms', {
    skip: (req) => req.url === "/" || req.url === "/api/health" || req.url.startsWith("/terminal"),
}));

// Request ID: lo usan los logs del errorHandler para correlacionar una
// respuesta con su causa en el log.
app.use((req, _res, next) => {
    req.id = randomUUID().slice(0, 8);
    next();
});

app.use(express.json());
app.use(express.text({ type: ['text/plain', 'text/csv'] }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/group-activities', groupActivityRoutes);

app.use(errorHandler);

app.get('/', (_req, res) => {
    res.json({ message: 'LinuxLab API' });
});

// Ruta de salud: la usan el healthcheck del compose y el deploy-server.sh.
// Esta al margen de morgan (skip) para no ensuciar el log.
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

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
