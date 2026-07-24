const Notification = require('../models/Notification');

// Helper: Create a notification
const createNotification = async (userId, title, message, type = 'system', link = null) => {
    try {
        return await Notification.create({ userId, title, message, type, link });
    } catch (error) {
        console.error('Failed to create notification:', error);
    }
};

// @desc Get notifications (paginated)
// @route GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find({ userId: req.user._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments({ userId: req.user._id }),
            Notification.countDocuments({ userId: req.user._id, read: false }),
        ]);

        res.json({ notifications, total, unreadCount, page, limit });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Mark notification as read
// @route PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { read: true },
            { new: true }
        );
        if (!notification) return res.status(404).json({ message: 'Not found' });
        res.json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Mark all notifications as read
// @route PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { userId: req.user._id, read: false },
            { read: true }
        );
        res.json({ message: 'All marked as read' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete a notification
// @route DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        res.json({ message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification, createNotification };
