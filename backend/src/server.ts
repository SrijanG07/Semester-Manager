import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/database';
import authRoutes from './routes/authRoutes';
import subjectRoutes from './routes/subjectRoutes';
import topicRoutes from './routes/topicRoutes';
import resourceRoutes from './routes/resourceRoutes';
import studyRoutes from './routes/studyRoutes';
import deadlineRoutes from './routes/deadlineRoutes';
import attendanceRoutes from './routes/attendanceRoutes';

dotenv.config();

const app: Application = express();
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

// Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'OK', message: 'Semester Manager API is running' });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Frontend: http://localhost:5173`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
});

export default app;
