const express = require("express")
const { randomUUID } = require("crypto")
const cookieParser = require("cookie-parser")
const cors = require("cors")
const helmet = require("helmet")
const morgan = require("morgan")
const config = require("./config/env")
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

app.use(helmet());

app.use(cors({
    origin: (origin, cb) => cb(null, !origin || config.corsOrigins.includes(origin)),
    credentials: true,
}));

app.use(morgan('[:date[clf]] [:method] :url :status :res[content-length] - :response-time ms', {
    skip: (req) => req.url === "/" || req.url === "/api/health" || req.url.startsWith("/terminal"),
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

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});

app.use((_req, res) => {
    res.status(404).json({ error: "Ruta no encontrada", code: "NOT_FOUND" });
});

app.use(errorHandler);

module.exports = app;
