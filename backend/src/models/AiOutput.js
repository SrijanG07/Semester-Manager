const mongoose = require('mongoose');

const aiOutputSchema = new mongoose.Schema(
    {
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource',
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['summary', 'explanation', 'quiz', 'flashcards'],
            required: true,
        },
        content: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        modelUsed: {
            type: String,
            required: true,
        },
        // For quiz/flashcards, link back to the source summary/explanation
        sourceOutputId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AiOutput',
        },
    },
    { timestamps: true }
);

// Index for fast lookups: all outputs for a resource by a user
aiOutputSchema.index({ resourceId: 1, userId: 1, type: 1 });
aiOutputSchema.index({ sourceOutputId: 1 });

module.exports = mongoose.model('AiOutput', aiOutputSchema);
