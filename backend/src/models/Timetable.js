const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema(
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
        dayOfWeek: {
            type: Number,
            required: true,
            min: 0,
            max: 6, // 0=Sunday, 1=Monday...6=Saturday
        },
        startTime: {
            type: String,
            required: true, // "09:00"
        },
        endTime: {
            type: String,
            required: true, // "10:00"
        },
        room: {
            type: String,
            trim: true,
        },
        type: {
            type: String,
            enum: ['Lecture', 'Lab', 'Tutorial', 'Seminar', 'Other'],
            default: 'Lecture',
        },
    },
    { timestamps: true }
);

timetableSchema.index({ userId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('Timetable', timetableSchema);
