const Deadline = require('../models/Deadline');
const Subject = require('../models/Subject');

// @desc Create deadline
// @route POST /api/deadlines
const createDeadline = async (req, res) => {
    try {
        const { subjectId, title, description, type, dueDate, dueTime } = req.body;

        const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        const deadline = await Deadline.create({ subjectId, title, description, type, dueDate, dueTime });
        res.status(201).json(deadline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all deadlines
// @route GET /api/deadlines
const getDeadlines = async (req, res) => {
    try {
        const { subjectId, completed, priority } = req.query;

        const userSubjects = await Subject.find({ userId: req.user._id });
        const subjectIds = userSubjects.map(s => s._id);

        if (subjectId && !subjectIds.some(id => id.toString() === subjectId)) {
            return res.status(403).json({ message: 'Subject not found or access denied' });
        }

        const filter = { subjectId: subjectId ? subjectId : { $in: subjectIds } };
        if (completed !== undefined) filter.completed = completed === 'true';
        if (priority) filter.priority = priority;

        const deadlines = await Deadline.find(filter)
            .populate('subjectId', 'name color')
            .sort({ dueDate: 1 });

        res.json(deadlines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get urgent deadlines
// @route GET /api/deadlines/urgent
const getUrgentDeadlines = async (req, res) => {
    try {
        const userSubjects = await Subject.find({ userId: req.user._id });
        const subjectIds = userSubjects.map(s => s._id);

        const deadlines = await Deadline.find({
            subjectId: { $in: subjectIds },
            completed: false,
            priority: { $in: ['urgent', 'overdue'] },
        })
            .populate('subjectId', 'name color')
            .sort({ dueDate: 1 });

        res.json(deadlines);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update deadline
// @route PUT /api/deadlines/:deadlineId
const updateDeadline = async (req, res) => {
    try {
        const deadline = await Deadline.findById(req.params.deadlineId).populate('subjectId');
        if (!deadline) return res.status(404).json({ message: 'Deadline not found' });

        const subject = await Subject.findOne({ _id: deadline.subjectId, userId: req.user._id });
        if (!subject) return res.status(403).json({ message: 'Not authorized to update this deadline' });

        if (req.body.subjectId && req.body.subjectId !== deadline.subjectId.toString()) {
            const newSubject = await Subject.findOne({ _id: req.body.subjectId, userId: req.user._id });
            if (!newSubject) return res.status(404).json({ message: 'Subject not found' });
        }

        Object.assign(deadline, req.body);
        await deadline.save();
        res.json(deadline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Mark deadline as complete
// @route PATCH /api/deadlines/:deadlineId/complete
const markComplete = async (req, res) => {
    try {
        const deadline = await Deadline.findById(req.params.deadlineId).populate('subjectId');
        if (!deadline) return res.status(404).json({ message: 'Deadline not found' });

        const subject = await Subject.findOne({ _id: deadline.subjectId, userId: req.user._id });
        if (!subject) return res.status(403).json({ message: 'Not authorized to update this deadline' });

        deadline.completed = !deadline.completed;
        deadline.completedDate = deadline.completed ? new Date() : undefined;
        await deadline.save();
        res.json(deadline);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete deadline
// @route DELETE /api/deadlines/:deadlineId
const deleteDeadline = async (req, res) => {
    try {
        const deadline = await Deadline.findById(req.params.deadlineId).populate('subjectId');
        if (!deadline) return res.status(404).json({ message: 'Deadline not found' });

        const subject = await Subject.findOne({ _id: deadline.subjectId, userId: req.user._id });
        if (!subject) return res.status(403).json({ message: 'Not authorized to delete this deadline' });

        await Deadline.findByIdAndDelete(req.params.deadlineId);
        res.json({ message: 'Deadline deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createDeadline, getDeadlines, getUrgentDeadlines, updateDeadline, markComplete, deleteDeadline };
