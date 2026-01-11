import { Response } from 'express';
import Attendance from '../models/Attendance';
import { AuthRequest } from '../middleware/auth';

// @desc Mark attendance
// @route POST /api/subjects/:id/attendance
export const markAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { date, status, notes } = req.body;

        const attendance = await Attendance.create({
            subjectId: req.params.id,
            date,
            status,
            notes,
        });

        res.status(201).json(attendance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get attendance records
// @route GET /api/subjects/:id/attendance
export const getAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const filter: any = { subjectId: req.params.id };

        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string),
            };
        }

        const attendance = await Attendance.find(filter).sort({ date: -1 });

        res.json(attendance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get attendance statistics
// @route GET /api/subjects/:id/attendance/stats
export const getAttendanceStats = async (req: AuthRequest, res: Response) => {
    try {
        const attendance = await Attendance.find({ subjectId: req.params.id });

        const totalClasses = attendance.length;
        const presentClasses = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const absentClasses = attendance.filter(a => a.status === 'absent').length;
        const lateClasses = attendance.filter(a => a.status === 'late').length;

        const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

        // Calculate classes needed for target (e.g., 75%)
        const target = 75;
        let classesNeeded = 0;

        if (attendancePercentage < target) {
            // Formula: classesNeeded = (target * (totalClasses + x) - presentClasses) / (1 - target/100)
            // Solving for x where x is classes to attend
            classesNeeded = Math.ceil((target * totalClasses - presentClasses * 100) / (100 - target));
        }

        res.json({
            totalClasses,
            presentClasses,
            absentClasses,
            lateClasses,
            attendancePercentage: attendancePercentage.toFixed(2),
            classesNeeded: Math.max(0, classesNeeded),
            belowTarget: attendancePercentage < target,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update attendance
// @route PUT /api/attendance/:attendanceId
export const updateAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const attendance = await Attendance.findByIdAndUpdate(
            req.params.attendanceId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        res.json(attendance);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete attendance
// @route DELETE /api/attendance/:attendanceId
export const deleteAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.attendanceId);

        if (!attendance) {
            return res.status(404).json({ message: 'Attendance record not found' });
        }

        res.json({ message: 'Attendance deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
