import mongoose, { Document, Schema } from 'mongoose';

export interface IDeadline extends Document {
    subjectId: mongoose.Types.ObjectId;
    title: string;
    description?: string;
    type: 'Assignment' | 'Quiz' | 'Midterm' | 'Endterm' | 'Project';
    dueDate: Date;
    dueTime?: string;
    completed: boolean;
    completedDate?: Date;
    priority: 'overdue' | 'urgent' | 'soon' | 'later';
    notificationSent: boolean;
    createdAt: Date;
}

const deadlineSchema = new Schema<IDeadline>(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
        },
        type: {
            type: String,
            enum: ['Assignment', 'Quiz', 'Midterm', 'Endterm', 'Project'],
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        dueTime: {
            type: String,
        },
        completed: {
            type: Boolean,
            default: false,
        },
        completedDate: {
            type: Date,
        },
        priority: {
            type: String,
            enum: ['overdue', 'urgent', 'soon', 'later'],
            default: 'later',
        },
        notificationSent: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-calculate priority before saving
deadlineSchema.pre('save', async function () {
    if (!this.completed) {
        const now = new Date();
        const dueDate = new Date(this.dueDate);
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntil < 0) {
            this.priority = 'overdue';
        } else if (daysUntil <= 3) {
            this.priority = 'urgent';
        } else if (daysUntil <= 7) {
            this.priority = 'soon';
        } else {
            this.priority = 'later';
        }
    }
});

deadlineSchema.index({ subjectId: 1, dueDate: 1 });
deadlineSchema.index({ priority: 1 });

const Deadline = mongoose.model<IDeadline>('Deadline', deadlineSchema);

export default Deadline;
