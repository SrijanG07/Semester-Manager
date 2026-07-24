const mongoose = require('mongoose');

const revisionPlanSchema = new mongoose.Schema(
    {
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        examDate: { type: Date, required: true },
        topics: [
            {
                topicId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Topic',
                    required: true,
                },
                scheduledDate: { type: Date, required: true },
                revised: { type: Boolean, default: false },
                revisionDate: { type: Date },
                revisionCount: { type: Number, default: 0 },
            },
        ],
    },
    { timestamps: true }
);

revisionPlanSchema.index({ subjectId: 1 });

module.exports = mongoose.model('RevisionPlan', revisionPlanSchema);
