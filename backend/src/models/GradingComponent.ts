import mongoose, { Document, Schema } from 'mongoose';

interface IGradingComponentItem {
    name: string;
    weightage: number;
    maxMarks?: number;
}

export interface IGradingComponent extends Document {
    subjectId: mongoose.Types.ObjectId;
    components: IGradingComponentItem[];
    createdAt: Date;
    updatedAt: Date;
}

const gradingComponentSchema = new Schema<IGradingComponent>(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
            unique: true,
        },
        components: [
            {
                name: {
                    type: String,
                    required: true,
                },
                weightage: {
                    type: Number,
                    required: true,
                    min: 0,
                    max: 100,
                },
                maxMarks: {
                    type: Number,
                    min: 0,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

// Validation: weightages must total 100%
gradingComponentSchema.pre('save', function (next) {
    const total = this.components.reduce((sum, comp) => sum + comp.weightage, 0);
    if (Math.abs(total - 100) > 0.01) {
        return next(new Error(`Weightages must total 100%, got ${total}%`));
    }
    next();
});

const GradingComponent = mongoose.model<IGradingComponent>('GradingComponent', gradingComponentSchema);

export default GradingComponent;
