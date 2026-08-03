require('dotenv/config');

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const morgan = require('morgan');
const prisma = require('../prisma/client');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');
const preferencesRoutes = require('./routes/preferences');
const terminalRoutes = require('./routes/terminal');
const logger = require('./lib/logger');
const errorHandler = require('./middleware/errorHandler');

const setupGateway = require('./gateway');
const { startWorker } = require('./services/provisioningWorker');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: true,
    credentials: true,
}));

app.use(morgan('[:date[clf]] [:method] :url :status :res[content-length] - :response-time ms', {
    skip: (req) => req.url === "/" || req.url === "/api/health" || req.url.startsWith("/terminal"),
}));

app.use(express.json());
app.use(express.text({ type: ['text/plain', 'text/csv'] }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/terminal', terminalRoutes);

app.use(errorHandler);

app.get('/', (_req, res) => {
    res.json({ message: 'LinuxLab API' });
});

const server = app.listen(PORT, () => {
    logger.info(`Server running at http://localhost:${PORT}`);
});

setupGateway(server);
startWorker();

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    server.close();
    process.exit(0);
});
