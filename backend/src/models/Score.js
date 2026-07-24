const mongoose = require('mongoose');

const scoreSchema = new mongoose.Schema(
    {
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        componentName: { type: String, required: true },
        obtained: { type: Number, required: true, min: 0 },
        max: { type: Number, required: true, min: 0 },
        classAverage: { type: Number, min: 0 },
        classMax: { type: Number, min: 0 },
        classMin: { type: Number, min: 0 },
        date: { type: Date, default: Date.now },
        lastUpdated: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// Validate: obtained cannot exceed max
scoreSchema.pre('save', function () {
    if (this.obtained > this.max) {
        throw new Error('Obtained score cannot exceed maximum score');
    }
});

scoreSchema.index({ subjectId: 1, componentName: 1 });

module.exports = mongoose.model('Score', scoreSchema);
