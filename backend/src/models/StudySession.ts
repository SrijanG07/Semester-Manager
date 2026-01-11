import mongoose, { Document, Schema } from 'mongoose';

export interface IStudySession extends Document {
    userId: mongoose.Types.ObjectId;
    subjectId: mongoose.Types.ObjectId;
    topicId?: mongoose.Types.ObjectId;
    date: Date;
    startTime: Date;
    endTime?: Date;
    duration: number; // in minutes
    notes?: string;
    focusLevel?: 'low' | 'medium' | 'high';
}

const studySessionSchema = new Schema<IStudySession>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        topicId: {
            type: Schema.Types.ObjectId,
            ref: 'Topic',
        },
        date: {
            type: Date,
            default: Date.now,
        },
        startTime: {
            type: Date,
            required: true,
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number,
            default: 0,
            min: 0,
        },
        notes: {
            type: String,
        },
        focusLevel: {
            type: String,
            enum: ['low', 'medium', 'high'],
        },
    },
    {
        timestamps: true,
    }
);

studySessionSchema.index({ userId: 1, date: -1 });
studySessionSchema.index({ subjectId: 1 });

const StudySession = mongoose.model<IStudySession>('StudySession', studySessionSchema);

export default StudySession;
