const mongoose = require('mongoose');

const gradingComponentSchema = new mongoose.Schema(
    {
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
            unique: true,
        },
        components: [
            {
                name: { type: String, required: true },
                weightage: { type: Number, required: true, min: 0, max: 100 },
                maxMarks: { type: Number, min: 0 },
            },
        ],
    },
    { timestamps: true }
);

// Validate: weightages must total 100%
gradingComponentSchema.pre('save', function (next) {
    const total = this.components.reduce((sum, comp) => sum + comp.weightage, 0);
    if (Math.abs(total - 100) > 0.01) {
        return next(new Error(`Weightages must total 100%, got ${total}%`));
    }
    next();
});

module.exports = mongoose.model('GradingComponent', gradingComponentSchema);
