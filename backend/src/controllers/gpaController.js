const GradingComponent = require('../models/GradingComponent');
const Score = require('../models/Score');
const Subject = require('../models/Subject');
const UserSettings = require('../models/UserSettings');

// Grade point mapping for different scales
const gradePointMap = {
    '4.0': [
        { min: 90, grade: 'A+', points: 4.0 },
        { min: 85, grade: 'A', points: 4.0 },
        { min: 80, grade: 'A-', points: 3.7 },
        { min: 75, grade: 'B+', points: 3.3 },
        { min: 70, grade: 'B', points: 3.0 },
        { min: 65, grade: 'B-', points: 2.7 },
        { min: 60, grade: 'C+', points: 2.3 },
        { min: 55, grade: 'C', points: 2.0 },
        { min: 50, grade: 'C-', points: 1.7 },
        { min: 45, grade: 'D', points: 1.0 },
        { min: 0, grade: 'F', points: 0.0 },
    ],
    '10.0': [
        { min: 90, grade: 'O', points: 10.0 },
        { min: 80, grade: 'A+', points: 9.0 },
        { min: 70, grade: 'A', points: 8.0 },
        { min: 60, grade: 'B+', points: 7.0 },
        { min: 55, grade: 'B', points: 6.0 },
        { min: 50, grade: 'C', points: 5.0 },
        { min: 45, grade: 'P', points: 4.0 },
        { min: 0, grade: 'F', points: 0.0 },
    ],
};

function getGradeInfo(percentage, scale) {
    if (scale === 'percentage') {
        return { grade: `${percentage.toFixed(1)}%`, points: percentage };
    }
    const map = gradePointMap[scale] || gradePointMap['10.0'];
    for (const entry of map) {
        if (percentage >= entry.min) return entry;
    }
    return map[map.length - 1];
}

// @desc Calculate semester GPA
// @route GET /api/gpa/calculate
const calculateGpa = async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user._id });
        const settings = await UserSettings.findOne({ userId: req.user._id });
        const scale = settings?.gpaScale || '10.0';

        const subjectResults = [];
        let totalWeightedPoints = 0;
        let totalCredits = 0;

        for (const subject of subjects) {
            const gradingScheme = await GradingComponent.findOne({ subjectId: subject._id });
            const scores = await Score.find({ subjectId: subject._id });

            if (!gradingScheme || scores.length === 0) {
                subjectResults.push({
                    subjectId: subject._id,
                    name: subject.name,
                    color: subject.color,
                    credits: subject.credits || 0,
                    percentage: null,
                    grade: null,
                    points: null,
                    hasData: false,
                });
                continue;
            }

            // Calculate percentage for this subject
            let currentTotal = 0;
            for (const component of gradingScheme.components) {
                const score = scores.find(s => s.componentName === component.name);
                if (score) {
                    const pct = (score.obtained / score.max) * 100;
                    currentTotal += pct * (component.weightage / 100);
                }
            }

            const gradeInfo = getGradeInfo(currentTotal, scale);
            const credits = subject.credits || 0;

            subjectResults.push({
                subjectId: subject._id,
                name: subject.name,
                color: subject.color,
                credits,
                percentage: parseFloat(currentTotal.toFixed(2)),
                grade: gradeInfo.grade,
                points: gradeInfo.points,
                hasData: true,
            });

            if (credits > 0) {
                totalWeightedPoints += gradeInfo.points * credits;
                totalCredits += credits;
            }
        }

        const gpa = totalCredits > 0
            ? parseFloat((totalWeightedPoints / totalCredits).toFixed(2))
            : null;

        res.json({
            gpa,
            scale,
            totalCredits,
            subjects: subjectResults,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc What-if GPA simulator
// @route POST /api/gpa/simulate
const simulateGpa = async (req, res) => {
    try {
        const { overrides } = req.body; // [{ subjectId, componentName, score, max }]
        const subjects = await Subject.find({ userId: req.user._id });
        const settings = await UserSettings.findOne({ userId: req.user._id });
        const scale = settings?.gpaScale || '10.0';

        let totalWeightedPoints = 0;
        let totalCredits = 0;
        const results = [];

        for (const subject of subjects) {
            const gradingScheme = await GradingComponent.findOne({ subjectId: subject._id });
            const scores = await Score.find({ subjectId: subject._id });

            if (!gradingScheme) continue;

            let currentTotal = 0;
            for (const component of gradingScheme.components) {
                // Check if there's an override for this component
                const override = overrides?.find(
                    o => o.subjectId === subject._id.toString() && o.componentName === component.name
                );

                if (override) {
                    const pct = (override.score / override.max) * 100;
                    currentTotal += pct * (component.weightage / 100);
                } else {
                    const score = scores.find(s => s.componentName === component.name);
                    if (score) {
                        const pct = (score.obtained / score.max) * 100;
                        currentTotal += pct * (component.weightage / 100);
                    }
                }
            }

            const gradeInfo = getGradeInfo(currentTotal, scale);
            const credits = subject.credits || 0;

            results.push({
                subjectId: subject._id,
                name: subject.name,
                percentage: parseFloat(currentTotal.toFixed(2)),
                grade: gradeInfo.grade,
                points: gradeInfo.points,
                credits,
            });

            if (credits > 0) {
                totalWeightedPoints += gradeInfo.points * credits;
                totalCredits += credits;
            }
        }

        const simulatedGpa = totalCredits > 0
            ? parseFloat((totalWeightedPoints / totalCredits).toFixed(2))
            : null;

        res.json({
            simulatedGpa,
            scale,
            totalCredits,
            subjects: results,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { calculateGpa, simulateGpa };
