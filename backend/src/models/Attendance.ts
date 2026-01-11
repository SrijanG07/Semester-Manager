import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
    subjectId: mongoose.Types.ObjectId;
    date: Date;
    status: 'present' | 'absent' | 'late';
    notes?: string;
}

const attendanceSchema = new Schema<IAttendance>(
    {
        subjectId: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        status: {
            type: String,
            enum: ['present', 'absent', 'late'],
            required: true,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

attendanceSchema.index({ subjectId: 1, date: -1 });

const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);

export default Attendance;
