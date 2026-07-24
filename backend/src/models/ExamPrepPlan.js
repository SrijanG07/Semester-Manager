const mongoose = require('mongoose');

const examPrepPlanSchema = new mongoose.Schema(
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
        examDate: { type: Date, required: true },
        generatedPlan: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },
        status: {
            type: String,
            enum: ['active', 'completed', 'archived'],
            default: 'active',
        },
        completedTasks: [{ type: String }], // array of task IDs marked done
    },
    { timestamps: true }
);

examPrepPlanSchema.index({ userId: 1, subjectId: 1 });

module.exports = mongoose.model('ExamPrepPlan', examPrepPlanSchema);
