require('dotenv/config');

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const prisma = require('../prisma/client');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const groupRoutes = require('./routes/groups');

const setupGateway = require('./gateway');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
}));

app.use(express.json());
app.use(express.text({ type: ['text/plain', 'text/csv'] }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/groups', groupRoutes);

app.get('/', (_req, res) => {
    res.json({ message: 'LinuxLab API' });
});

const server = app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

setupGateway(server);

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    server.close();
    process.exit(0);
});
