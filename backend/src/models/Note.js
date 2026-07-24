const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Topic',
        },
        title: {
            type: String,
            required: true,
            trim: true,
            default: 'Untitled Note',
        },
        content: {
            type: String,
            default: '',
        },
        isPinned: {
            type: Boolean,
            default: false,
        },
        tags: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

noteSchema.index({ userId: 1, subjectId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, isPinned: -1, updatedAt: -1 });

module.exports = mongoose.model('Note', noteSchema);
