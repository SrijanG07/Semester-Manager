const Subject = require('../models/Subject');
const GradingComponent = require('../models/GradingComponent');
const Score = require('../models/Score');
const StudySession = require('../models/StudySession');
const Deadline = require('../models/Deadline');
const Topic = require('../models/Topic');
const Attendance = require('../models/Attendance');
const Note = require('../models/Note');
const Timetable = require('../models/Timetable');

// @desc Export all user data
// @route GET /api/data/export
const exportData = async (req, res) => {
    try {
        const userId = req.user._id;

        const [subjects, scores, studySessions, deadlines, topics, attendance, notes, timetable] =
            await Promise.all([
                Subject.find({ userId }),
                Score.find({ subjectId: { $in: (await Subject.find({ userId })).map(s => s._id) } }),
                StudySession.find({ userId }),
                Deadline.find({ subjectId: { $in: (await Subject.find({ userId })).map(s => s._id) } }),
                Topic.find({ subjectId: { $in: (await Subject.find({ userId })).map(s => s._id) } }),
                Attendance.find({ subjectId: { $in: (await Subject.find({ userId })).map(s => s._id) } }),
                Note.find({ userId }),
                Timetable.find({ userId }),
            ]);

        // Get grading components
        const gradingComponents = await GradingComponent.find({
            subjectId: { $in: subjects.map(s => s._id) },
        });

        const exportPayload = {
            exportedAt: new Date().toISOString(),
            version: '1.0',
            data: {
                subjects,
                gradingComponents,
                scores,
                studySessions,
                deadlines,
                topics,
                attendance,
                notes,
                timetable,
            },
        };

        res.json(exportPayload);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Import user data (basic — creates new records)
// @route POST /api/data/import
const importData = async (req, res) => {
    try {
        const { data } = req.body;
        if (!data) return res.status(400).json({ message: 'No data provided' });

        let imported = { subjects: 0, notes: 0 };

        // Import subjects
        if (data.subjects?.length) {
            for (const subj of data.subjects) {
                await Subject.create({
                    userId: req.user._id,
                    name: subj.name,
                    code: subj.code,
                    credits: subj.credits,
                    instructor: subj.instructor,
                    semester: subj.semester,
                    color: subj.color,
                });
                imported.subjects++;
            }
        }

        // Import notes
        if (data.notes?.length) {
            for (const note of data.notes) {
                await Note.create({
                    userId: req.user._id,
                    title: note.title,
                    content: note.content,
                    isPinned: note.isPinned,
                    tags: note.tags,
                });
                imported.notes++;
            }
        }

        res.json({ message: 'Import successful', imported });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { exportData, importData };
