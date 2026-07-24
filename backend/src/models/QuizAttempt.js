const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
    {
        aiOutputId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AiOutput',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        score: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
        answers: [
            {
                questionIndex: Number,
                selectedIndex: Number,
                correct: Boolean,
            },
        ],
        takenAt: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

quizAttemptSchema.index({ aiOutputId: 1, userId: 1 });
quizAttemptSchema.index({ userId: 1, takenAt: -1 });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
