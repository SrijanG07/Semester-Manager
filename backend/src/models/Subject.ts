import mongoose, { Document, Schema } from 'mongoose';

export interface ISubject extends Document {
    userId: mongoose.Types.ObjectId;
    name: string;
    code: string;
    credits: number;
    instructor: string;
    semester: string;
    color: string;
    createdAt: Date;
    updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        name: {
            type: String,
            required: [true, 'Subject name is required'],
            trim: true,
        },
        code: {
            type: String,
            trim: true,
        },
        credits: {
            type: Number,
            min: 0,
        },
        instructor: {
            type: String,
            trim: true,
        },
        semester: {
            type: String,
            trim: true,
        },
        color: {
            type: String,
            default: '#3B82F6', // Default blue color
        },
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
subjectSchema.index({ userId: 1 });

const Subject = mongoose.model<ISubject>('Subject', subjectSchema);

export default Subject;
