const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Subject name is required'],
            trim: true,
        },
        code: { type: String, trim: true },
        credits: { type: Number, min: 0 },
        instructor: { type: String, trim: true },
        semester: { type: String, trim: true },
        color: { type: String, default: '#3B82F6' },
    },
    { timestamps: true }
);

subjectSchema.index({ userId: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
