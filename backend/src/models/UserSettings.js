const mongoose = require('mongoose');

const userSettingsSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
        },
        theme: {
            type: String,
            enum: ['light', 'dark', 'system'],
            default: 'system',
        },
        gpaScale: {
            type: String,
            enum: ['4.0', '10.0', 'percentage'],
            default: '10.0',
        },
        pomodoroWork: {
            type: Number,
            default: 25,
            min: 1,
            max: 120,
        },
        pomodoroBreak: {
            type: Number,
            default: 5,
            min: 1,
            max: 60,
        },
        pomodoroLongBreak: {
            type: Number,
            default: 15,
            min: 1,
            max: 60,
        },
        pomodoroSessionsBeforeLongBreak: {
            type: Number,
            default: 4,
            min: 1,
            max: 10,
        },
        studyGoalHours: {
            type: Number,
            default: 20,
            min: 0,
        },
        notificationsEnabled: {
            type: Boolean,
            default: true,
        },
        soundEnabled: {
            type: Boolean,
            default: true,
        },
        weekStartsOn: {
            type: Number,
            default: 1, // Monday
            min: 0,
            max: 6,
        },
    },
    { timestamps: true }
);

userSettingsSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('UserSettings', userSettingsSchema);
