const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
    {
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        topicId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Topic',
        },
        title: { type: String, required: true, trim: true },
        type: {
            type: String,
            enum: ['PYQ', 'Book', 'Class Notes', 'Personal Notes'],
            required: true,
        },
        fileUrl: { type: String },
        firebaseStoragePath: { type: String },
        externalLink: { type: String },
        completed: { type: Boolean, default: false },
        hasPersonalNotes: { type: Boolean, default: false },
        personalNotesId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource',
        },
        uploadDate: { type: Date, default: Date.now },
        tags: [{ type: String, trim: true }],
    },
    { timestamps: true }
);

resourceSchema.index({ subjectId: 1, type: 1 });
resourceSchema.index({ topicId: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
