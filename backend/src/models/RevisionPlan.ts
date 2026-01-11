import mongoose, { Document, Schema } from 'mongoose';

interface IRevisionTopic {
    topicId: mongoose.Types.ObjectId;
    scheduledDate: Date;
    revised: boolean;
    revisionDate?: Date;
    revisionCount: number;
}

export interface IRevisionPlan extends Document {
    subjectId: mongoose.Types.ObjectId;
    examDate: Date;
    createdAt: Date;
    topics: IRevisionTopic[];
}

const revisionPlanSchema = new Schema<IRevisionPlan>(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        examDate: {
            type: Date,
            required: true,
        },
        topics: [
            {
                topicId: {
                    type: Schema.Types.ObjectId,
                    ref: 'Topic',
                    required: true,
                },
                scheduledDate: {
                    type: Date,
                    required: true,
                },
                revised: {
                    type: Boolean,
                    default: false,
                },
                revisionDate: {
                    type: Date,
                },
                revisionCount: {
                    type: Number,
                    default: 0,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

revisionPlanSchema.index({ subjectId: 1 });

const RevisionPlan = mongoose.model<IRevisionPlan>('RevisionPlan', revisionPlanSchema);

export default RevisionPlan;
