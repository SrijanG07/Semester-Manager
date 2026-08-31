const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Score = require('../models/Score');
const Topic = require('../models/Topic');
const Resource = require('../models/Resource');
const Deadline = require('../models/Deadline');
const StudySession = require('../models/StudySession');
const AiOutput = require('../models/AiOutput');
const GradingComponent = require('../models/GradingComponent');
const Note = require('../models/Note');
const Timetable = require('../models/Timetable');

// Helper to cascade-delete data for an array of subject IDs
const cascadeDeleteSubjects = async (subjectIds) => {
    if (!subjectIds || subjectIds.length === 0) return;
    await Promise.allSettled([
        Attendance.deleteMany({ subjectId: { $in: subjectIds } }),
        Score.deleteMany({ subjectId: { $in: subjectIds } }),
        Topic.deleteMany({ subjectId: { $in: subjectIds } }),
        Resource.deleteMany({ subjectId: { $in: subjectIds } }),
        Deadline.deleteMany({ subjectId: { $in: subjectIds } }),
        StudySession.deleteMany({ subjectId: { $in: subjectIds } }),
        AiOutput.deleteMany({ subjectId: { $in: subjectIds } }),
        GradingComponent.deleteMany({ subjectId: { $in: subjectIds } }),
        Note.deleteMany({ subjectId: { $in: subjectIds } }),
        Timetable.deleteMany({ subjectId: { $in: subjectIds } }),
        Subject.deleteMany({ _id: { $in: subjectIds } }),
    ]);
};

// @desc Create new subject
// @route POST /api/subjects
const createSubject = async (req, res) => {
    try {
        const { name, code, credits, instructor, semester, color } = req.body;

        const subject = await Subject.create({
            userId: req.user._id,
            name, code,
            credits: credits !== undefined ? Number(credits) : 3,
            instructor,
            semester: semester ? semester.trim() : 'Semester 1',
            color: color || '#7c3aed',
        });

        res.status(201).json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all subjects for user (with optional ?semester= filter)
// @route GET /api/subjects
const getSubjects = async (req, res) => {
    try {
        const { semester } = req.query;
        const filter = { userId: req.user._id };

        if (semester && semester !== 'all' && semester !== 'All') {
            filter.semester = semester;
        }

        const subjects = await Subject.find(filter).sort({ createdAt: -1 });
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get semesters summary for user
// @route GET /api/subjects/semesters/summary
const getSemestersSummary = async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user._id });
        
        const semesterMap = {};
        subjects.forEach((sub) => {
            const semName = sub.semester || 'Unassigned';
            if (!semesterMap[semName]) {
                semesterMap[semName] = {
                    name: semName,
                    count: 0,
                    totalCredits: 0,
                    subjectIds: [],
                };
            }
            semesterMap[semName].count += 1;
            semesterMap[semName].totalCredits += (sub.credits || 0);
            semesterMap[semName].subjectIds.push(sub._id);
        });

        // Convert to sorted array (Sem 1, Sem 2, etc.)
        const summary = Object.values(semesterMap).sort((a, b) => {
            return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        });

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get single subject
// @route GET /api/subjects/:id
const getSubject = async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update subject
// @route PUT /api/subjects/:id
const updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        );
        if (!subject) return res.status(404).json({ message: 'Subject not found' });
        res.json(subject);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete single subject with cascading cleanup
// @route DELETE /api/subjects/:id
const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findOne({ _id: req.params.id, userId: req.user._id });
        if (!subject) return res.status(404).json({ message: 'Subject not found' });

        await cascadeDeleteSubjects([subject._id]);
        res.json({ message: 'Subject and all associated data deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete an entire semester and all its subjects + associated records
// @route DELETE /api/subjects/semesters/:semesterName
const deleteSemester = async (req, res) => {
    try {
        const { semesterName } = req.params;
        const subjects = await Subject.find({
            userId: req.user._id,
            semester: semesterName,
        });

        if (!subjects || subjects.length === 0) {
            return res.status(404).json({ message: `No subjects found in ${semesterName}` });
        }

        const subjectIds = subjects.map((s) => s._id);
        await cascadeDeleteSubjects(subjectIds);

        res.json({
            message: `Successfully deleted ${semesterName} and ${subjectIds.length} subjects with all associated records.`,
            deletedCount: subjectIds.length,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createSubject,
    getSubjects,
    getSemestersSummary,
    getSubject,
    updateSubject,
    deleteSubject,
    deleteSemester,
};
