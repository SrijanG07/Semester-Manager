import mongoose, { Document, Schema } from 'mongoose';

export interface IScore extends Document {
    subjectId: mongoose.Types.ObjectId;
    componentName: string;
    obtained: number;
    max: number;
    classAverage?: number;
    classMax?: number;
    classMin?: number;
    date: Date;
    lastUpdated: Date;
}

const scoreSchema = new Schema<IScore>(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        componentName: {
            type: String,
            required: true,
        },
        obtained: {
            type: Number,
            required: true,
            min: 0,
        },
        max: {
            type: Number,
            required: true,
            min: 0,
        },
        classAverage: {
            type: Number,
            min: 0,
        },
        classMax: {
            type: Number,
            min: 0,
        },
        classMin: {
            type: Number,
            min: 0,
        },
        date: {
            type: Date,
            default: Date.now,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Validation: obtained cannot exceed max
scoreSchema.pre('save', function (this: any) {
    if (this.obtained > this.max) {
        throw new Error('Obtained score cannot exceed maximum score');
    }
});

scoreSchema.index({ subjectId: 1, componentName: 1 });

const Score = mongoose.model<IScore>('Score', scoreSchema);

export default Score;
