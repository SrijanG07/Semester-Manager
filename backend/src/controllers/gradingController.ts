import { Response } from 'express';
import GradingComponent from '../models/GradingComponent';
import Score from '../models/Score';
import { AuthRequest } from '../middleware/auth';

// @desc Set/Update grading scheme
// @route POST/PUT /api/subjects/:id/grading
export const setGradingScheme = async (req: AuthRequest, res: Response) => {
    try {
        const { components } = req.body;

        // Validate total weightage is 100%
        const total = components.reduce((sum: number, comp: any) => sum + comp.weightage, 0);
        if (Math.abs(total - 100) > 0.01) {
            return res.status(400).json({ message: `Weightages must total 100%, got ${total}%` });
        }

        const gradingScheme = await GradingComponent.findOneAndUpdate(
            { subjectId: req.params.id },
            { subjectId: req.params.id, components },
            { new: true, upsert: true, runValidators: true }
        );

        res.json(gradingScheme);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get grading scheme
// @route GET /api/subjects/:id/grading
export const getGradingScheme = async (req: AuthRequest, res: Response) => {
    try {
        const gradingScheme = await GradingComponent.findOne({ subjectId: req.params.id });

        if (!gradingScheme) {
            return res.status(404).json({ message: 'Grading scheme not found' });
        }

        res.json(gradingScheme);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Add score
// @route POST /api/subjects/:id/scores
export const addScore = async (req: AuthRequest, res: Response) => {
    try {
        const { componentName, obtained, max, classAverage, classMax, classMin } = req.body;

        const score = await Score.create({
            subjectId: req.params.id,
            componentName,
            obtained,
            max,
            classAverage,
            classMax,
            classMin,
        });

        res.status(201).json(score);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all scores for subject
// @route GET /api/subjects/:id/scores
export const getScores = async (req: AuthRequest, res: Response) => {
    try {
        const scores = await Score.find({ subjectId: req.params.id }).sort({ date: -1 });
        res.json(scores);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Calculate current percentage
// @route GET /api/subjects/:id/calculate
export const calculateScore = async (req: AuthRequest, res: Response) => {
    try {
        const gradingScheme = await GradingComponent.findOne({ subjectId: req.params.id });

        if (!gradingScheme) {
            return res.status(404).json({ message: 'Grading scheme not set' });
        }

        const scores = await Score.find({ subjectId: req.params.id });

        let currentTotal = 0;
        const breakdown: any[] = [];

        for (const component of gradingScheme.components) {
            const score = scores.find(s => s.componentName === component.name);

            if (score) {
                const percentage = (score.obtained / score.max) * 100;
                const weightedScore = percentage * (component.weightage / 100);
                currentTotal += weightedScore;

                breakdown.push({
                    name: component.name,
                    obtained: score.obtained,
                    max: score.max,
                    percentage: percentage.toFixed(2),
                    weightage: component.weightage,
                    weightedScore: weightedScore.toFixed(2),
                    classAverage: score.classAverage,
                });
            } else {
                breakdown.push({
                    name: component.name,
                    obtained: null,
                    max: null,
                    percentage: null,
                    weightage: component.weightage,
                    weightedScore: 0,
                });
            }
        }

        res.json({
            currentTotal: currentTotal.toFixed(2),
            breakdown,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update score
// @route PUT /api/scores/:scoreId
export const updateScore = async (req: AuthRequest, res: Response) => {
    try {
        const score = await Score.findByIdAndUpdate(
            req.params.scoreId,
            { ...req.body, lastUpdated: Date.now() },
            { new: true, runValidators: true }
        );

        if (!score) {
            return res.status(404).json({ message: 'Score not found' });
        }

        res.json(score);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete score
// @route DELETE /api/scores/:scoreId
export const deleteScore = async (req: AuthRequest, res: Response) => {
    try {
        const score = await Score.findByIdAndDelete(req.params.scoreId);

        if (!score) {
            return res.status(404).json({ message: 'Score not found' });
        }

        res.json({ message: 'Score deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
