const Timetable = require('../models/Timetable');

// @desc Get all timetable entries for user
// @route GET /api/timetable
const getTimetable = async (req, res) => {
    try {
        const entries = await Timetable.find({ userId: req.user._id })
            .populate('subjectId', 'name color code')
            .sort({ dayOfWeek: 1, startTime: 1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Create timetable entry
// @route POST /api/timetable
const createTimetableEntry = async (req, res) => {
    try {
        const { subjectId, dayOfWeek, startTime, endTime, room, type } = req.body;

        if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime <= startTime) return res.status(400).json({ message: 'Enter a valid start and end time' });
        // Check for time conflicts
        const conflicts = await Timetable.find({
            userId: req.user._id,
            dayOfWeek,
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } },
            ],
        });

        if (conflicts.length > 0) {
            return res.status(400).json({ message: 'Time slot conflicts with an existing entry' });
        }

        const entry = await Timetable.create({
            userId: req.user._id,
            subjectId, dayOfWeek, startTime, endTime, room, type,
        });

        const populated = await entry.populate('subjectId', 'name color code');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update timetable entry
// @route PUT /api/timetable/:id
const updateTimetableEntry = async (req, res) => {
    try {
        const entry = await Timetable.findOne({ _id: req.params.id, userId: req.user._id });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        for (const field of ['subjectId', 'dayOfWeek', 'startTime', 'endTime', 'room', 'type']) {
            if (req.body[field] !== undefined) entry[field] = req.body[field];
        }
        const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
        if (!validTime.test(entry.startTime) || !validTime.test(entry.endTime) || entry.endTime <= entry.startTime) {
            return res.status(400).json({ message: 'Enter a valid start and end time' });
        }
        if (await Timetable.exists({ userId: req.user._id, _id: { $ne: entry._id }, dayOfWeek: entry.dayOfWeek, startTime: { $lt: entry.endTime }, endTime: { $gt: entry.startTime } })) {
            return res.status(400).json({ message: 'Time slot conflicts with an existing entry' });
        }
        await entry.save();
        await entry.populate('subjectId', 'name color code');
        res.json(entry);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete timetable entry
// @route DELETE /api/timetable/:id
const deleteTimetableEntry = async (req, res) => {
    try {
        const entry = await Timetable.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!entry) return res.status(404).json({ message: 'Entry not found' });
        res.json({ message: 'Entry deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getTimetable, createTimetableEntry, updateTimetableEntry, deleteTimetableEntry };
