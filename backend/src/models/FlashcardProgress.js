const mongoose = require('mongoose');

const flashcardProgressSchema = new mongoose.Schema(
    {
        aiOutputId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AiOutput',
            required: true,
        },
        cardIndex: {
            type: Number,
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        ease: {
            type: String,
            enum: ['again', 'good', 'easy'],
            default: 'again',
        },
        interval: {
            type: Number, // days until next review
            default: 0,
        },
        dueDate: {
            type: Date,
            default: Date.now,
        },
        lastReviewedAt: {
            type: Date,
        },
    },
    { timestamps: true }
);

// Unique per card per user
flashcardProgressSchema.index({ aiOutputId: 1, cardIndex: 1, userId: 1 }, { unique: true });
flashcardProgressSchema.index({ userId: 1, dueDate: 1 });

module.exports = mongoose.model('FlashcardProgress', flashcardProgressSchema);
