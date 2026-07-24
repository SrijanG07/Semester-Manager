const UserSettings = require('../models/UserSettings');

// @desc Get user settings (auto-create if not exists)
// @route GET /api/settings
const getSettings = async (req, res) => {
    try {
        let settings = await UserSettings.findOne({ userId: req.user._id });
        if (!settings) {
            settings = await UserSettings.create({ userId: req.user._id });
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update user settings
// @route PUT /api/settings
const updateSettings = async (req, res) => {
    try {
        const allowedFields = [
            'theme', 'gpaScale', 'pomodoroWork', 'pomodoroBreak',
            'pomodoroLongBreak', 'pomodoroSessionsBeforeLongBreak',
            'studyGoalHours', 'notificationsEnabled', 'soundEnabled', 'weekStartsOn',
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const settings = await UserSettings.findOneAndUpdate(
            { userId: req.user._id },
            updates,
            { new: true, upsert: true, runValidators: true }
        );

        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getSettings, updateSettings };
