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

// Connect to database
connectDB();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', process.env.FRONTEND_URL].filter(Boolean),
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'AcademiQ API is running' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:5173`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
});

module.exports = app;
