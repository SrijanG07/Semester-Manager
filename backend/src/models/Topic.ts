import mongoose, { Document, Schema } from 'mongoose';

export interface ITopic extends Document {
    subjectId: mongoose.Types.ObjectId;
    name: string;
    unit?: string;
    status: 'not-started' | 'learning' | 'needs-practice' | 'confident';
    notes?: string;
    createdAt: Date;
    lastRevisedAt?: Date;
}

const topicSchema = new Schema<ITopic>(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        unit: {
            type: String,
            trim: true,
        },
        status: {
            type: String,
            enum: ['not-started', 'learning', 'needs-practice', 'confident'],
            default: 'not-started',
        },
        notes: {
            type: String,
        },
        lastRevisedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

topicSchema.index({ subjectId: 1 });

const Topic = mongoose.model<ITopic>('Topic', topicSchema);

export default Topic;
