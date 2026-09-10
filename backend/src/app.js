const express = require("express")
const { randomUUID } = require("crypto")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const config = require("./config/env")
const prisma = require("../prisma/client")
const authRoutes = require("./routes/authRoutes")
const adminRoutes = require("./routes/adminRoutes")
const groupRoutes = require("./routes/groupRoutes")
const enrollmentRoutes = require("./routes/enrollmentRoutes")
const preferenceRoutes = require("./routes/preferenceRoutes")
const terminalRoutes = require("./routes/terminalRoutes")
const activityRoutes = require("./routes/activityRoutes")
const groupActivityRoutes = require("./routes/groupActivityRoutes")
const submissionRoutes = require("./routes/submissionRoutes")
const studentActivityDetailRoutes = require("./routes/studentActivityDetailRoutes")
const studentRoutes = require("./routes/studentRoutes")
const auditRoutes = require("./routes/auditRoutes")
const progressRoutes = require("./routes/progressRoutes")
const certificateRoutes = require("./routes/certificateRoutes")
const errorHandler = require("./middleware/errorHandler")

const app = express()

/**
 * Tras el proxy (Caddy) todas las peticiones llegan con la IP del proxy: sin
 * esto, express-rate-limit metia a TODOS los usuarios en un solo bucket (30
 * req/min compartidos) y un grupo entero de estudiantes bloqueaba la
 * evaluacion al darle "Comprobar" en bloque. Con `1` se confia en el primer
 * salto de la cadena X-Forwarded-For y cada cliente pesa por su IP.
 */
app.set('trust proxy', 1);

app.use(helmet());

/**
 * Ninguna respuesta de la API se guarda en una cache intermedia.
 *
 * Casi todas llevan datos de quien pregunta, pero la URL es la misma para todo
 * el mundo: `/api/activities/mine/status` no lleva el id en la ruta, lo saca de
 * la sesion. Sin cabecera de cache, un proxy delante del backend aplica su
 * heuristica, guarda la primera respuesta y se la sirve al siguiente que pida
 * esa URL — que es otra persona.
 *
 * Paso de verdad: un estudiante veia las actividades de otro marcadas como
 * completadas, desde otra maquina y otra red, mientras su propio progreso salia
 * en cero. `helmet()` no pone `Cache-Control`, asi que hay que ponerla aqui.
 *
 * `private` se la prohibe a las caches compartidas; `no-store`, ademas, que la
 * escriban en disco.
 */
app.use("/api", (_req, res, next) => {
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Vary", "Cookie");
    next();
});

app.use(cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
}));

app.use(morgan('[:date[clf]] [:method] :url :status :res[content-length] - :response-time ms', {
	// En pruebas unitarias el acceso HTTP ensucia el reporte de Jest.
	skip: (req) => req.url === "/" || req.url === "/api/health" || req.url.startsWith("/terminal") || process.env.NODE_ENV === "test",
}));

app.use((req, _res, next) => {
    req.id = randomUUID().slice(0, 8);
    next();
});

app.use(express.json({ limit: "256kb" }));
app.use(express.text({ type: ['text/plain', 'text/csv'], limit: "1mb" }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/enroll', enrollmentRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/group-activities', groupActivityRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api', progressRoutes);
app.use('/api/groups/:id/activities/:activityId/students/:studentId', studentActivityDetailRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'LinuxLab API' });
});

// Comprueba la base, no solo que el proceso responda: un backend que sigue en
// pie pero sin base no sirve de nada, y devolver 'ok' ahi impide que el
// orquestador lo reinicie. La consulta es la mas barata que existe.
app.get('/api/health', async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.json({ status: 'ok', db: 'up' });
    } catch (err) {
        res.status(503).json({ status: 'error', db: 'down', message: err.message });
    }
});

app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada", code: "NOT_FOUND" });
});

app.use(errorHandler);

module.exports = app;
