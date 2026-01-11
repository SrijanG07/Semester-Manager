import { Response } from 'express';
import Deadline from '../models/Deadline';
import Subject from '../models/Subject';
import { AuthRequest } from '../middleware/auth';

// @desc Create deadline
// @route POST /api/deadlines
export const createDeadline = async (req: AuthRequest, res: Response) => {
    try {
        const { subjectId, title, description, type, dueDate, dueTime } = req.body;

        // Verify subject belongs to user
        const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        const deadline = await Deadline.create({
            subjectId,
            title,
            description,
            type,
            dueDate,
            dueTime,
        });

        res.status(201).json(deadline);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all deadlines
// @route GET /api/deadlines
export const getDeadlines = async (req: AuthRequest, res: Response) => {
    try {
        const { subjectId, completed, priority } = req.query;

        // Get user's subjects to filter deadlines
        const userSubjects = await Subject.find({ userId: req.user._id });
        const subjectIds = userSubjects.map(s => s._id);

        // If specific subjectId provided, verify it belongs to user
        if (subjectId && !subjectIds.some(id => id.toString() === subjectId)) {
            return res.status(403).json({ message: 'Subject not found or access denied' });
        }

        const filter: any = {
            subjectId: subjectId ? subjectId : { $in: subjectIds }
        };
        if (completed !== undefined) filter.completed = completed === 'true';
        if (priority) filter.priority = priority;

        const deadlines = await Deadline.find(filter)
            .populate('subjectId', 'name color')
            .sort({ dueDate: 1 });

        res.json(deadlines);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get urgent deadlines
// @route GET /api/deadlines/urgent
export const getUrgentDeadlines = async (req: AuthRequest, res: Response) => {
    try {
        // Get user's subjects to filter deadlines
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
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update deadline
// @route PUT /api/deadlines/:deadlineId
export const updateDeadline = async (req: AuthRequest, res: Response) => {
    try {
        const deadline = await Deadline.findById(req.params.deadlineId)
            .populate('subjectId');

        if (!deadline) {
            return res.status(404).json({ message: 'Deadline not found' });
        }

        // Verify subject belongs to user
        const subject = await Subject.findOne({ _id: deadline.subjectId, userId: req.user._id });
        if (!subject) {
            return res.status(403).json({ message: 'Not authorized to update this deadline' });
        }

        // If subjectId is being updated, verify new subject belongs to user
        if (req.body.subjectId && req.body.subjectId !== deadline.subjectId.toString()) {
            const newSubject = await Subject.findOne({ _id: req.body.subjectId, userId: req.user._id });
            if (!newSubject) {
                return res.status(404).json({ message: 'Subject not found' });
            }
        }

        Object.assign(deadline, req.body);
        await deadline.save();

        res.json(deadline);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Mark deadline as complete
// @route PATCH /api/deadlines/:deadlineId/complete
export const markComplete = async (req: AuthRequest, res: Response) => {
    try {
        const deadline = await Deadline.findById(req.params.deadlineId)
            .populate('subjectId');

        if (!deadline) {
            return res.status(404).json({ message: 'Deadline not found' });
        }

        // Verify subject belongs to user
        const subject = await Subject.findOne({ _id: deadline.subjectId, userId: req.user._id });
        if (!subject) {
            return res.status(403).json({ message: 'Not authorized to update this deadline' });
        }

        deadline.completed = !deadline.completed;
        deadline.completedDate = deadline.completed ? new Date() : undefined;
        await deadline.save();

        res.json(deadline);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete deadline
// @route DELETE /api/deadlines/:deadlineId
export const deleteDeadline = async (req: AuthRequest, res: Response) => {
    try {
        const deadline = await Deadline.findById(req.params.deadlineId)
            .populate('subjectId');

        if (!deadline) {
            return res.status(404).json({ message: 'Deadline not found' });
        }

        // Verify subject belongs to user
        const subject = await Subject.findOne({ _id: deadline.subjectId, userId: req.user._id });
        if (!subject) {
            return res.status(403).json({ message: 'Not authorized to delete this deadline' });
        }

        await Deadline.findByIdAndDelete(req.params.deadlineId);

        res.json({ message: 'Deadline deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
