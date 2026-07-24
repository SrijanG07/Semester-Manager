const StudySession = require('../models/StudySession');
const { startOfDay, subDays } = require('date-fns');
const { updateStreak, checkStudyHourAchievements } = require('./gamificationController');

// @desc Create/Start study session
// @route POST /api/study-sessions
const createStudySession = async (req, res) => {
    try {
        const { subjectId, topicId, startTime, endTime, duration, notes, focusLevel } = req.body;
        const session = await StudySession.create({
            userId: req.user._id,
            subjectId, topicId,
            startTime: startTime || new Date(),
            endTime,
            duration: duration || 0,
            notes, focusLevel,
        });

        // Update streak and check achievements (fire-and-forget)
        updateStreak(req.user._id).catch(console.error);
        checkStudyHourAchievements(req.user._id).catch(console.error);

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all study sessions
// @route GET /api/study-sessions
const getStudySessions = async (req, res) => {
    try {
        const { subjectId, startDate, endDate } = req.query;
        const filter = { userId: req.user._id };

        if (subjectId) filter.subjectId = subjectId;
        if (startDate && endDate) {
            filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
        }

        const sessions = await StudySession.find(filter)
            .populate('subjectId', 'name color')
            .populate('topicId', 'name')
            .sort({ date: -1 });

        res.json(sessions);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get study statistics
// @route GET /api/study-sessions/stats
const getStudyStats = async (req, res) => {
    try {
        const { period = 'week' } = req.query;
        const endDate = new Date();
        let startDate;

        switch (period) {
            case 'day': startDate = startOfDay(new Date()); break;
            case 'week': startDate = subDays(endDate, 7); break;
            case 'month': startDate = subDays(endDate, 30); break;
            default: startDate = subDays(endDate, 7);
        }

        const sessions = await StudySession.find({
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate },
        }).populate('subjectId', 'name color');

        const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

        // Subject-wise distribution
        const subjectStats = {};
        sessions.forEach(session => {
            const sid = session.subjectId._id.toString();
            if (!subjectStats[sid]) {
                subjectStats[sid] = {
                    subjectId: sid,
                    subjectName: session.subjectId.name,
                    subjectColor: session.subjectId.color,
                    totalMinutes: 0,
                    sessionCount: 0,
                };
            }
            subjectStats[sid].totalMinutes += session.duration;
            subjectStats[sid].sessionCount += 1;
        });

        // Heatmap data (last 90 days)
        const heatmapSessions = await StudySession.find({
            userId: req.user._id,
            date: { $gte: subDays(endDate, 90), $lte: endDate },
        });

        const heatmapData = {};
        heatmapSessions.forEach(s => {
            const key = s.date.toISOString().split('T')[0];
            heatmapData[key] = (heatmapData[key] || 0) + s.duration;
        });

        // Daily breakdown
        const dailyStats = {};
        sessions.forEach(s => {
            const key = s.date.toISOString().split('T')[0];
            dailyStats[key] = (dailyStats[key] || 0) + s.duration;
        });

        res.json({
            totalMinutes,
            totalHours: (totalMinutes / 60).toFixed(2),
            sessionCount: sessions.length,
            subjectDistribution: Object.values(subjectStats),
            heatmapData,
            dailyStats,
            period,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update study session
// @route PUT /api/study-sessions/:sessionId
const updateStudySession = async (req, res) => {
    try {
        const session = await StudySession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.json(session);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete study session
// @route DELETE /api/study-sessions/:sessionId
const deleteStudySession = async (req, res) => {
    try {
        const session = await StudySession.findOneAndDelete({
            _id: req.params.sessionId,
            userId: req.user._id,
        });
        if (!session) return res.status(404).json({ message: 'Session not found' });
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createStudySession, getStudySessions, getStudyStats, updateStudySession, deleteStudySession };
