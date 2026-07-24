const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: [
                'streak_3', 'streak_7', 'streak_14', 'streak_30',
                'study_10h', 'study_50h', 'study_100h',
                'flashcards_50', 'flashcards_100', 'flashcards_500',
                'perfect_quiz',
                'subjects_5', 'subjects_10',
                'first_session', 'night_owl', 'early_bird',
            ],
            required: true,
        },
        unlockedAt: { type: Date, default: Date.now },
        seen: { type: Boolean, default: false },
    },
    { timestamps: true }
);

achievementSchema.index({ userId: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('Achievement', achievementSchema);
