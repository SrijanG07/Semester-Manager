const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const subjectRoutes = require('./routes/subjectRoutes');
const topicRoutes = require('./routes/topicRoutes');
const resourceRoutes = require('./routes/resourceRoutes');
const studyRoutes = require('./routes/studyRoutes');
const deadlineRoutes = require('./routes/deadlineRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const aiRoutes = require('./routes/aiRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const timetableRoutes = require('./routes/timetableRoutes');
const gpaRoutes = require('./routes/gpaRoutes');
const gamificationRoutes = require('./routes/gamificationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const noteRoutes = require('./routes/noteRoutes');
const exportRoutes = require('./routes/exportRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to database on startup
connectDB().catch((err) => console.error('Initial DB connection error:', err.message));

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    try {
        await connectDB();
    } catch (err) {
        console.error('DB connection error in middleware:', err.message);
    }
    next();
});

// CORS
app.use(cors({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        const allowed = [
            'http://localhost:5173',
            'http://localhost:5174',
            'http://localhost:5175',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        if (allowed.includes(origin) || origin.endsWith('.vercel.app') || process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root & Health check
app.get('/', (req, res) => {
    res.json({ status: 'OK', message: 'AcademiQ API is running' });
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'AcademiQ API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/subjects', topicRoutes);
app.use('/api/subjects', resourceRoutes);
app.use('/api/subjects', attendanceRoutes);
app.use('/api/study-sessions', studyRoutes);
app.use('/api/deadlines', deadlineRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/gpa', gpaRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/data', exportRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server locally (only when not running inside Vercel serverless)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on port ${PORT}`);
        console.log(`📱 Frontend: http://localhost:5173`);
        console.log(`🔧 API: http://localhost:${PORT}/api`);
    });
}

module.exports = app;
