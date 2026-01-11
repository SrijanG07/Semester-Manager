import mongoose, { Document, Schema } from 'mongoose';

export interface IResource extends Document {
    subjectId: mongoose.Types.ObjectId;
    topicId?: mongoose.Types.ObjectId;
    title: string;
    type: 'PYQ' | 'Book' | 'Class Notes' | 'Personal Notes';
    fileUrl?: string;
    externalLink?: string;
    completed: boolean;
    hasPersonalNotes: boolean;
    personalNotesId?: mongoose.Types.ObjectId;
    uploadDate: Date;
    tags: string[];
}

const resourceSchema = new Schema<IResource>(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        topicId: {
            type: Schema.Types.ObjectId,
            ref: 'Topic',
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['PYQ', 'Book', 'Class Notes', 'Personal Notes'],
            required: true,
        },
        fileUrl: {
            type: String,
        },
        externalLink: {
            type: String,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        hasPersonalNotes: {
            type: Boolean,
            default: false,
        },
        personalNotesId: {
            type: Schema.Types.ObjectId,
            ref: 'Resource',
        },
        uploadDate: {
            type: Date,
            default: Date.now,
        },
        tags: [{
            type: String,
            trim: true,
        }],
    },
    {
        timestamps: true,
    }
);

resourceSchema.index({ subjectId: 1, type: 1 });
resourceSchema.index({ topicId: 1 });

const Resource = mongoose.model<IResource>('Resource', resourceSchema);

export default Resource;
