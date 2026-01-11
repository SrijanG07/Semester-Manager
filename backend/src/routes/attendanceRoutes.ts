import express from 'express';
import {
    markAttendance,
    getAttendance,
    getAttendanceStats,
    updateAttendance,
    deleteAttendance,
} from '../controllers/attendanceController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Attendance routes (attached to subjects)
router.post('/:id/attendance', protect, markAttendance);
router.get('/:id/attendance', protect, getAttendance);
router.get('/:id/attendance/stats', protect, getAttendanceStats);

// Attendance management
router.put('/attendance/:attendanceId', protect, updateAttendance);
router.delete('/attendance/:attendanceId', protect, deleteAttendance);

export default router;
