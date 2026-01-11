import { Response } from 'express';
import Subject from '../models/Subject';
import { AuthRequest } from '../middleware/auth';

// @desc Create new subject
// @route POST /api/subjects
export const createSubject = async (req: AuthRequest, res: Response) => {
    try {
        const { name, code, credits, instructor, semester, color } = req.body;

        const subject = await Subject.create({
            userId: req.user._id,
            name,
            code,
            credits,
            instructor,
            semester,
            color: color || '#3B82F6',
        });

        res.status(201).json(subject);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all subjects for user
// @route GET /api/subjects
export const getSubjects = async (req: AuthRequest, res: Response) => {
    try {
        const subjects = await Subject.find({ userId: req.user._id }).sort({ createdAt: -1 });
        res.json(subjects);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get single subject
// @route GET /api/subjects/:id
export const getSubject = async (req: AuthRequest, res: Response) => {
    try {
        const subject = await Subject.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json(subject);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update subject
// @route PUT /api/subjects/:id
export const updateSubject = async (req: AuthRequest, res: Response) => {
    try {
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json(subject);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete subject
// @route DELETE /api/subjects/:id
export const deleteSubject = async (req: AuthRequest, res: Response) => {
    try {
        const subject = await Subject.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!subject) {
            return res.status(404).json({ message: 'Subject not found' });
        }

        res.json({ message: 'Subject deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
