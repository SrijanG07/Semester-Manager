const Streak = require('../models/Streak');
const Achievement = require('../models/Achievement');
const StudySession = require('../models/StudySession');
const { startOfDay } = require('date-fns');

// Achievement definitions
const ACHIEVEMENTS = {
    streak_3: { title: '3-Day Streak', description: 'Study 3 days in a row', icon: '🔥', category: 'Streaks' },
    streak_7: { title: 'Week Warrior', description: 'Study 7 days in a row', icon: '⚡', category: 'Streaks' },
    streak_14: { title: 'Two Week Titan', description: 'Study 14 days in a row', icon: '💪', category: 'Streaks' },
    streak_30: { title: 'Monthly Master', description: 'Study 30 days in a row', icon: '👑', category: 'Streaks' },
    study_10h: { title: 'Getting Started', description: 'Study for 10 total hours', icon: '📚', category: 'Study' },
    study_50h: { title: 'Dedicated Learner', description: 'Study for 50 total hours', icon: '🎯', category: 'Study' },
    study_100h: { title: 'Century Club', description: 'Study for 100 total hours', icon: '💯', category: 'Study' },
    flashcards_50: { title: 'Card Collector', description: 'Review 50 flashcards', icon: '🃏', category: 'Flashcards' },
    flashcards_100: { title: 'Flash Master', description: 'Review 100 flashcards', icon: '⭐', category: 'Flashcards' },
    flashcards_500: { title: 'Memory Champion', description: 'Review 500 flashcards', icon: '🏆', category: 'Flashcards' },
    perfect_quiz: { title: 'Perfect Score', description: 'Get 100% on a quiz', icon: '🎯', category: 'Quizzes' },
    subjects_5: { title: 'Well Rounded', description: 'Create 5 subjects', icon: '📖', category: 'Study' },
    subjects_10: { title: 'Scholar', description: 'Create 10 subjects', icon: '🎓', category: 'Study' },
    first_session: { title: 'First Steps', description: 'Complete your first study session', icon: '🌱', category: 'Study' },
    night_owl: { title: 'Night Owl', description: 'Study after midnight', icon: '🦉', category: 'Study' },
    early_bird: { title: 'Early Bird', description: 'Study before 6 AM', icon: '🐦', category: 'Study' },
};

// Update streak when a study session is logged
const updateStreak = async (userId) => {
    try {
        const today = startOfDay(new Date());
        let streak = await Streak.findOne({ userId });

        if (!streak) {
            streak = await Streak.create({
                userId,
                currentStreak: 1,
                longestStreak: 1,
                lastStudyDate: today,
                totalStudyDays: 1,
            });
        } else {
            const lastDate = streak.lastStudyDate ? startOfDay(new Date(streak.lastStudyDate)) : null;
            const todayMs = today.getTime();

            if (lastDate && lastDate.getTime() === todayMs) {
                // Already studied today, no streak change
                return streak;
            }

            const yesterday = new Date(todayMs - 86400000);

            if (lastDate && lastDate.getTime() === yesterday.getTime()) {
                // Consecutive day
                streak.currentStreak += 1;
            } else {
                // Streak broken
                streak.currentStreak = 1;
            }

            streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
            streak.lastStudyDate = today;
            streak.totalStudyDays += 1;
            await streak.save();
        }

        // Check streak achievements
        const streakThresholds = { 3: 'streak_3', 7: 'streak_7', 14: 'streak_14', 30: 'streak_30' };
        for (const [threshold, type] of Object.entries(streakThresholds)) {
            if (streak.currentStreak >= parseInt(threshold)) {
                await Achievement.findOneAndUpdate(
                    { userId, type },
                    { userId, type, unlockedAt: new Date() },
                    { upsert: true, new: true }
                );
            }
        }

        return streak;
    } catch (error) {
        console.error('Error updating streak:', error);
    }
};

// Check study hour achievements
const checkStudyHourAchievements = async (userId) => {
    try {
        const sessions = await StudySession.find({ userId });
        const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        const totalHours = totalMinutes / 60;

        const hourThresholds = { 10: 'study_10h', 50: 'study_50h', 100: 'study_100h' };
        for (const [threshold, type] of Object.entries(hourThresholds)) {
            if (totalHours >= parseInt(threshold)) {
                await Achievement.findOneAndUpdate(
                    { userId, type },
                    { userId, type, unlockedAt: new Date() },
                    { upsert: true, new: true }
                );
            }
        }

        // First session achievement
        if (sessions.length >= 1) {
            await Achievement.findOneAndUpdate(
                { userId, type: 'first_session' },
                { userId, type: 'first_session', unlockedAt: new Date() },
                { upsert: true, new: true }
            );
        }

        // Time-based achievements
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 0 && hour < 5) {
            await Achievement.findOneAndUpdate(
                { userId, type: 'night_owl' },
                { userId, type: 'night_owl', unlockedAt: new Date() },
                { upsert: true, new: true }
            );
        }
        if (hour >= 4 && hour < 6) {
            await Achievement.findOneAndUpdate(
                { userId, type: 'early_bird' },
                { userId, type: 'early_bird', unlockedAt: new Date() },
                { upsert: true, new: true }
            );
        }
    } catch (error) {
        console.error('Error checking achievements:', error);
    }
};

// @desc Get streak data
// @route GET /api/gamification/streak
const getStreak = async (req, res) => {
    try {
        let streak = await Streak.findOne({ userId: req.user._id });
        if (!streak) {
            streak = { currentStreak: 0, longestStreak: 0, lastStudyDate: null, totalStudyDays: 0 };
        }
        res.json(streak);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all achievements
// @route GET /api/gamification/achievements
const getAchievements = async (req, res) => {
    try {
        const unlocked = await Achievement.find({ userId: req.user._id });
        const unlockedTypes = unlocked.map(a => a.type);

        const allAchievements = Object.entries(ACHIEVEMENTS).map(([type, info]) => ({
            type,
            ...info,
            unlocked: unlockedTypes.includes(type),
            unlockedAt: unlocked.find(a => a.type === type)?.unlockedAt || null,
            seen: unlocked.find(a => a.type === type)?.seen ?? false,
        }));

        res.json(allAchievements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Mark achievement as seen
// @route PUT /api/gamification/achievements/:type/seen
const markAchievementSeen = async (req, res) => {
    try {
        await Achievement.findOneAndUpdate(
            { userId: req.user._id, type: req.params.type },
            { seen: true }
        );
        res.json({ message: 'Marked as seen' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getStreak, getAchievements, markAchievementSeen,
    updateStreak, checkStudyHourAchievements,
    ACHIEVEMENTS,
};
