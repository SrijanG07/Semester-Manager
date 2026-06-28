import { Response } from 'express';
import Attendance from '../models/Attendance';
import Subject from '../models/Subject';
import { AuthRequest } from '../middleware/auth';

// @desc Mark attendance for a single day
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

// @desc Bulk sync attendance (set count)
// @route POST /api/subjects/attendance/sync
export const syncAttendance = async (req: AuthRequest, res: Response) => {
    try {
        const { attendanceData } = req.body;
        // attendanceData format: { "Subject Name": { attended: 5, total: 10, missedDates: ["1 May", "3 May"] } }

        if (!attendanceData || typeof attendanceData !== 'object') {
            return res.status(400).json({ message: 'Invalid attendance data' });
        }

        const userId = (req as any).user?.id;
        const results: any[] = [];

        for (const [subjectName, data] of Object.entries(attendanceData) as any) {
            // Find matching subject by name (case-insensitive partial match)
            let subject = await Subject.findOne({
                userId,
                name: { $regex: new RegExp(subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            });

            if (!subject) {
                // Auto-create subject if not found
                subject = await Subject.create({
                    userId,
                    name: subjectName,
                    code: subjectName.split(' ').map((w: string) => w[0]).join('').toUpperCase(),
                    credits: 0,
                    semester: 'Current',
                });
            }

            // Clear existing attendance for this subject (full resync)
            await Attendance.deleteMany({ subjectId: subject._id });

            // Create attendance records — present ones
            const attendedCount = data.attended || 0;
            const totalCount = data.total || 0;
            const absentCount = totalCount - attendedCount;

            const records: any[] = [];

            // Create "present" records
            for (let i = 0; i < attendedCount; i++) {
                records.push({
                    subjectId: subject._id,
                    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Spread across days
                    status: 'present',
                    notes: 'Synced',
                });
            }

            // Create "absent" records using missed dates if available
            const missedDates = data.missedDates || [];
            for (let i = 0; i < absentCount; i++) {
                const dateNote = missedDates[i] ? `Missed on ${missedDates[i]}` : 'Absent';
                records.push({
                    subjectId: subject._id,
                    date: new Date(Date.now() - (attendedCount + i) * 24 * 60 * 60 * 1000),
                    status: 'absent',
                    notes: dateNote,
                });
            }

            if (records.length > 0) {
                await Attendance.insertMany(records);
            }

            results.push({
                subject: subjectName,
                subjectId: subject._id,
                attended: attendedCount,
                total: totalCount,
                percentage: totalCount > 0 ? ((attendedCount / totalCount) * 100).toFixed(2) : '0',
            });
        }

        res.json({
            message: `Synced attendance for ${results.length} subjects`,
            results,
        });
    } catch (error: any) {
        console.error('Attendance sync error:', error);
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
            // Also return in the format the frontend AttendanceTab expects
            percentage: attendancePercentage,
            present: presentClasses,
            absent: absentClasses,
            late: lateClasses,
            total: totalClasses,
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
