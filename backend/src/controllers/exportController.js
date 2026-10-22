const mongoose = require('mongoose');
// Dependency order matters: references are remapped before any insert occurs.
const collections = {
    subjects: 'Subject', topics: 'Topic', resources: 'Resource',
    gradingComponents: 'GradingComponent', scores: 'Score', attendance: 'Attendance',
    deadlines: 'Deadline', studySessions: 'StudySession', notes: 'Note', timetable: 'Timetable',
    aiOutputs: 'AiOutput', quizAttempts: 'QuizAttempt', flashcardProgress: 'FlashcardProgress',
};
const models = Object.fromEntries(Object.entries(collections).map(([key, name]) => [key, require(`../models/${name}`)]));
const references = ['subjectId', 'topicId', 'resourceId', 'aiOutputId', 'sourceOutputId', 'personalNotesId'];

async function exportData(req, res, next) {
    try {
        const subjects = await models.subjects.find({ userId: req.user._id }).lean();
        const subjectIds = subjects.map(s => s._id);
        const data = { subjects };
        for (const [key, Model] of Object.entries(models)) {
            if (key === 'subjects') continue;
            const filter = Model.schema.path('userId') ? { userId: req.user._id } : { subjectId: { $in: subjectIds } };
            data[key] = await Model.find(filter).lean();
        }
        res.json({ version: '2.0', exportedAt: new Date().toISOString(), data });
    } catch (error) { next(error); }
}

async function importData(req, res, next) {
    const session = await mongoose.startSession();
    try {
        const data = req.body.data;
        if (!data || typeof data !== 'object') return res.status(400).json({ message: 'Invalid backup' });
        const ids = new Map();
        for (const [key, rows] of Object.entries(data)) {
            if (!models[key] || !Array.isArray(rows)) throw new Error(`Invalid collection: ${key}`);
            for (const row of rows) {
                if (!row._id || ids.has(String(row._id))) throw new Error('Missing or duplicate backup ID');
                ids.set(String(row._id), new mongoose.Types.ObjectId());
            }
        }
        const imported = {};
        await session.withTransaction(async () => {
            for (const [key, Model] of Object.entries(models)) {
                const rows = (data[key] || []).map(row => {
                    const copy = { ...row, _id: ids.get(String(row._id)) };
                    delete copy.__v;
                    if (Model.schema.path('userId')) copy.userId = req.user._id;
                    for (const field of references) {
                        if (!copy[field]) continue;
                        const id = ids.get(String(copy[field]));
                        if (!id) throw new Error(`Missing backup reference: ${field}`);
                        copy[field] = id;
                    }
                    return copy;
                });
                if (rows.length) await Model.create(rows, { session });
                imported[key] = rows.length;
            }
        });
        res.json({ message: 'Backup restored', imported });
    } catch (error) { next(error); }
    finally { await session.endSession(); }
}
module.exports = { exportData, importData };
