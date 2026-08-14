const express = require("express")
const { randomUUID } = require("crypto")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const morgan = require("morgan")
const config = require("./config/env")
const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const groupRoutes = require("./routes/groupRoutes")
const preferenceRoutes = require("./routes/preferenceRoutes")
const terminalRoutes = require("./routes/terminalRoutes")
const activityRoutes = require("./routes/activityRoutes")
const groupActivityRoutes = require("./routes/groupActivityRoutes")
const errorHandler = require("./middleware/errorHandler")

const app = express()

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
app.use('/api/preferences', preferenceRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/group-activities', groupActivityRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'LinuxLab API' });
});

// Ruta de salud: la usan el healthcheck del compose y el deploy-server.sh.
// Esta al margen de morgan (skip) para no ensuciar el log.
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

// Cualquier ruta que no matchee responde JSON, no el HTML por defecto de
// Express. Debe ir despues de las rutas reales y antes del errorHandler.
app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada", code: "NOT_FOUND" });
});

app.use(errorHandler);

module.exports = app;
