const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
    {
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        name: { type: String, required: true, trim: true },
        unit: { type: String, trim: true },
        status: {
            type: String,
            enum: ['not-started', 'learning', 'needs-practice', 'confident'],
            default: 'not-started',
        },
        notes: { type: String },
        order: { type: Number, default: 0 },
        lastRevisedAt: { type: Date },
    },
    { timestamps: true }
);

topicSchema.index({ subjectId: 1 });

module.exports = mongoose.model('Topic', topicSchema);
