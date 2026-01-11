import { Response } from 'express';
import StudySession from '../models/StudySession';
import { AuthRequest } from '../middleware/auth';
import { startOfDay, endOfDay, subDays } from 'date-fns';

// @desc Create/Start study session
// @route POST /api/study-sessions
export const createStudySession = async (req: AuthRequest, res: Response) => {
    try {
        const { subjectId, topicId, startTime, endTime, duration, notes, focusLevel } = req.body;

        const session = await StudySession.create({
            userId: req.user._id,
            subjectId,
            topicId,
            startTime: startTime || new Date(),
            endTime,
            duration: duration || 0,
            notes,
            focusLevel,
        });

        res.status(201).json(session);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all study sessions
// @route GET /api/study-sessions
export const getStudySessions = async (req: AuthRequest, res: Response) => {
    try {
        const { subjectId, startDate, endDate } = req.query;

        const filter: any = { userId: req.user._id };

        if (subjectId) filter.subjectId = subjectId;
        if (startDate && endDate) {
            filter.date = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string),
            };
        }

        const sessions = await StudySession.find(filter)
            .populate('subjectId', 'name color')
            .populate('topicId', 'name')
            .sort({ date: -1 });

        res.json(sessions);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get study statistics
// @route GET /api/study-sessions/stats
export const getStudyStats = async (req: AuthRequest, res: Response) => {
    try {
        const { period = 'week' } = req.query;

        let startDate: Date;
        const endDate = new Date();

        switch (period) {
            case 'day':
                startDate = startOfDay(new Date());
                break;
            case 'week':
                startDate = subDays(endDate, 7);
                break;
            case 'month':
                startDate = subDays(endDate, 30);
                break;
            default:
                startDate = subDays(endDate, 7);
        }

        const sessions = await StudySession.find({
            userId: req.user._id,
            date: { $gte: startDate, $lte: endDate },
        }).populate('subjectId', 'name color');

        // Total study time
        const totalMinutes = sessions.reduce((sum, session) => sum + session.duration, 0);

        // Subject-wise distribution
        const subjectStats: any = {};
        sessions.forEach(session => {
            const subjectId = (session.subjectId as any)._id.toString();
            const subjectName = (session.subjectId as any).name;
            const subjectColor = (session.subjectId as any).color;

            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    subjectId,
                    subjectName,
                    subjectColor,
                    totalMinutes: 0,
                    sessionCount: 0,
                };
            }

            subjectStats[subjectId].totalMinutes += session.duration;
            subjectStats[subjectId].sessionCount += 1;
        });

        // Heatmap data (last 90 days)
        const heatmapStartDate = subDays(endDate, 90);
        const heatmapSessions = await StudySession.find({
            userId: req.user._id,
            date: { $gte: heatmapStartDate, $lte: endDate },
        });

        const heatmapData: any = {};
        heatmapSessions.forEach(session => {
            const dateKey = session.date.toISOString().split('T')[0];
            if (!heatmapData[dateKey]) {
                heatmapData[dateKey] = 0;
            }
            heatmapData[dateKey] += session.duration;
        });

        // Daily breakdown
        const dailyStats: any = {};
        sessions.forEach(session => {
            const dateKey = session.date.toISOString().split('T')[0];
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = 0;
            }
            dailyStats[dateKey] += session.duration;
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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update study session
// @route PUT /api/study-sessions/:sessionId
export const updateStudySession = async (req: AuthRequest, res: Response) => {
    try {
        const session = await StudySession.findOneAndUpdate(
            { _id: req.params.sessionId, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json(session);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete study session
// @route DELETE /api/study-sessions/:sessionId
export const deleteStudySession = async (req: AuthRequest, res: Response) => {
    try {
        const session = await StudySession.findOneAndDelete({
            _id: req.params.sessionId,
            userId: req.user._id,
        });

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({ message: 'Session deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
