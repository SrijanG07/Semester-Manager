const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
    {
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        date: { type: Date, required: true },
        status: {
            type: String,
            enum: ['present', 'absent', 'late'],
            required: true,
        },
        notes: { type: String },
    },
    { timestamps: true }
);

attendanceSchema.index({ subjectId: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
