const mongoose = require('mongoose');

const studySessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Topic',
        },
        date: { type: Date, default: Date.now },
        startTime: { type: Date, required: true },
        endTime: { type: Date },
        duration: { type: Number, default: 0, min: 0 }, // in minutes
        notes: { type: String },
        focusLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
        },
    },
    { timestamps: true }
);

studySessionSchema.index({ userId: 1, date: -1 });
studySessionSchema.index({ subjectId: 1 });

module.exports = mongoose.model('StudySession', studySessionSchema);
