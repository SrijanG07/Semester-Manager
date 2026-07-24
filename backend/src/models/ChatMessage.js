const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        resourceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Resource',
            required: true,
        },
        role: {
            type: String,
            enum: ['user', 'assistant'],
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

chatMessageSchema.index({ userId: 1, resourceId: 1, createdAt: 1 });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
