const { ownsRecord } = require('../middleware/ownership');
const express = require('express');
const {
    markAttendance, syncAttendance, getAttendance, getAttendanceStats, updateAttendance, deleteAttendance,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Bulk attendance sync (must be before /:id routes to avoid conflict)
router.post('/attendance/sync', protect, syncAttendance);

// Attendance routes (attached to subjects)
router.post('/:id/attendance', protect, ownsRecord('Subject', 'id'), markAttendance);
router.get('/:id/attendance', protect, ownsRecord('Subject', 'id'), getAttendance);
router.get('/:id/attendance/stats', protect, ownsRecord('Subject', 'id'), getAttendanceStats);

// Attendance management
router.put('/attendance/:attendanceId', protect, ownsRecord('Attendance', 'attendanceId'), updateAttendance);
router.delete('/attendance/:attendanceId', protect, ownsRecord('Attendance', 'attendanceId'), deleteAttendance);

module.exports = router;
