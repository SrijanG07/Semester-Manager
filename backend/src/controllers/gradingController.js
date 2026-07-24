const GradingComponent = require('../models/GradingComponent');
const Score = require('../models/Score');

// @desc Set/Update grading scheme
// @route POST/PUT /api/subjects/:id/grading
const setGradingScheme = async (req, res) => {
    try {
        const { components } = req.body;

        const total = components.reduce((sum, comp) => sum + comp.weightage, 0);
        if (Math.abs(total - 100) > 0.01) {
            return res.status(400).json({ message: `Weightages must total 100%, got ${total}%` });
        }

        const gradingScheme = await GradingComponent.findOneAndUpdate(
            { subjectId: req.params.id },
            { subjectId: req.params.id, components },
            { new: true, upsert: true, runValidators: true }
        );

        res.json(gradingScheme);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get grading scheme
// @route GET /api/subjects/:id/grading
const getGradingScheme = async (req, res) => {
    try {
        const gradingScheme = await GradingComponent.findOne({ subjectId: req.params.id });
        if (!gradingScheme) return res.status(404).json({ message: 'Grading scheme not found' });
        res.json(gradingScheme);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Add score
// @route POST /api/subjects/:id/scores
const addScore = async (req, res) => {
    try {
        const { componentName, obtained, max, classAverage, classMax, classMin } = req.body;
        const score = await Score.create({
            subjectId: req.params.id,
            componentName, obtained, max, classAverage, classMax, classMin,
        });
        res.status(201).json(score);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all scores for subject
// @route GET /api/subjects/:id/scores
const getScores = async (req, res) => {
    try {
        const scores = await Score.find({ subjectId: req.params.id }).sort({ date: -1 });
        res.json(scores);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Calculate current percentage
// @route GET /api/subjects/:id/calculate
const calculateScore = async (req, res) => {
    try {
        const gradingScheme = await GradingComponent.findOne({ subjectId: req.params.id });
        if (!gradingScheme) return res.status(404).json({ message: 'Grading scheme not set' });

        const scores = await Score.find({ subjectId: req.params.id });

        let currentTotal = 0;
        const breakdown = [];

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
                    obtained: null, max: null, percentage: null,
                    weightage: component.weightage,
                    weightedScore: 0,
                });
            }
        }

        const totalWeightEntered = gradingScheme.components
            .filter(comp => scores.find(s => s.componentName === comp.name))
            .reduce((sum, comp) => sum + comp.weightage, 0);

        res.json({
            currentScore: parseFloat(currentTotal.toFixed(2)),
            totalWeightEntered: parseFloat(totalWeightEntered.toFixed(2)),
            breakdown,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update score
// @route PUT /api/scores/:scoreId
const updateScore = async (req, res) => {
    try {
        const score = await Score.findByIdAndUpdate(
            req.params.scoreId,
            { ...req.body, lastUpdated: Date.now() },
            { new: true, runValidators: true }
        );
        if (!score) return res.status(404).json({ message: 'Score not found' });
        res.json(score);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete score
// @route DELETE /api/scores/:scoreId
const deleteScore = async (req, res) => {
    try {
        const score = await Score.findByIdAndDelete(req.params.scoreId);
        if (!score) return res.status(404).json({ message: 'Score not found' });
        res.json({ message: 'Score deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { setGradingScheme, getGradingScheme, addScore, getScores, calculateScore, updateScore, deleteScore };
