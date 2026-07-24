const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');

// @desc Mark attendance for a single day
// @route POST /api/subjects/:id/attendance
const markAttendance = async (req, res) => {
    try {
        const { date, status, notes } = req.body;
        const attendance = await Attendance.create({ subjectId: req.params.id, date, status, notes });
        res.status(201).json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Bulk sync attendance (set count)
// @route POST /api/subjects/attendance/sync
const syncAttendance = async (req, res) => {
    try {
        const { attendanceData } = req.body;

        if (!attendanceData || typeof attendanceData !== 'object') {
            return res.status(400).json({ message: 'Invalid attendance data' });
        }

        const userId = req.user?.id;
        const results = [];

        for (const [subjectName, data] of Object.entries(attendanceData)) {
            let subject = await Subject.findOne({
                userId,
                name: { $regex: new RegExp(subjectName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') },
            });

            if (!subject) {
                subject = await Subject.create({
                    userId,
                    name: subjectName,
                    code: subjectName.split(' ').map(w => w[0]).join('').toUpperCase(),
                    credits: 0,
                    semester: 'Current',
                });
            }

            await Attendance.deleteMany({ subjectId: subject._id });

            const attendedCount = data.attended || 0;
            const totalCount = data.total || 0;
            const absentCount = totalCount - attendedCount;
            const records = [];

            for (let i = 0; i < attendedCount; i++) {
                records.push({
                    subjectId: subject._id,
                    date: new Date(Date.now() - i * 86400000),
                    status: 'present',
                    notes: 'Synced',
                });
            }

            const missedDates = data.missedDates || [];
            for (let i = 0; i < absentCount; i++) {
                records.push({
                    subjectId: subject._id,
                    date: new Date(Date.now() - (attendedCount + i) * 86400000),
                    status: 'absent',
                    notes: missedDates[i] ? `Missed on ${missedDates[i]}` : 'Absent',
                });
            }

            if (records.length > 0) await Attendance.insertMany(records);

            results.push({
                subject: subjectName,
                subjectId: subject._id,
                attended: attendedCount,
                total: totalCount,
                percentage: totalCount > 0 ? ((attendedCount / totalCount) * 100).toFixed(2) : '0',
            });
        }

        res.json({ message: `Synced attendance for ${results.length} subjects`, results });
    } catch (error) {
        console.error('Attendance sync error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc Get attendance records
// @route GET /api/subjects/:id/attendance
const getAttendance = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const filter = { subjectId: req.params.id };

        if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const attendance = await Attendance.find(filter).sort({ date: -1 });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get attendance statistics
// @route GET /api/subjects/:id/attendance/stats
const getAttendanceStats = async (req, res) => {
    try {
        const attendance = await Attendance.find({ subjectId: req.params.id });

        const totalClasses = attendance.length;
        const presentClasses = attendance.filter(a => a.status === 'present' || a.status === 'late').length;
        const absentClasses = attendance.filter(a => a.status === 'absent').length;
        const lateClasses = attendance.filter(a => a.status === 'late').length;
        const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

        // Calculate classes needed for 75% target
        const target = 75;
        let classesNeeded = 0;
        if (attendancePercentage < target) {
            classesNeeded = Math.ceil((target * totalClasses - presentClasses * 100) / (100 - target));
        }

        res.json({
            totalClasses, presentClasses, absentClasses, lateClasses,
            attendancePercentage: attendancePercentage.toFixed(2),
            classesNeeded: Math.max(0, classesNeeded),
            belowTarget: attendancePercentage < target,
            percentage: attendancePercentage,
            present: presentClasses,
            absent: absentClasses,
            late: lateClasses,
            total: totalClasses,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update attendance
// @route PUT /api/attendance/:attendanceId
const updateAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndUpdate(
            req.params.attendanceId, req.body, { new: true, runValidators: true }
        );
        if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
        res.json(attendance);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete attendance
// @route DELETE /api/attendance/:attendanceId
const deleteAttendance = async (req, res) => {
    try {
        const attendance = await Attendance.findByIdAndDelete(req.params.attendanceId);
        if (!attendance) return res.status(404).json({ message: 'Attendance record not found' });
        res.json({ message: 'Attendance deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { markAttendance, syncAttendance, getAttendance, getAttendanceStats, updateAttendance, deleteAttendance };
