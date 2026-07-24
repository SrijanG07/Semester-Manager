const Note = require('../models/Note');

// @desc Get all notes
// @route GET /api/notes
const getNotes = async (req, res) => {
    try {
        const filter = { userId: req.user._id };
        if (req.query.subjectId) filter.subjectId = req.query.subjectId;
        if (req.query.search) {
            filter.$or = [
                { title: { $regex: req.query.search, $options: 'i' } },
                { content: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        const notes = await Note.find(filter)
            .populate('subjectId', 'name color')
            .sort({ isPinned: -1, updatedAt: -1 });

        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Create a note
// @route POST /api/notes
const createNote = async (req, res) => {
    try {
        const { title, content, subjectId, topicId, tags } = req.body;
        const note = await Note.create({
            userId: req.user._id,
            title: title || 'Untitled Note',
            content, subjectId, topicId, tags,
        });
        const populated = await note.populate('subjectId', 'name color');
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update a note
// @route PUT /api/notes/:id
const updateNote = async (req, res) => {
    try {
        const note = await Note.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            req.body,
            { new: true, runValidators: true }
        ).populate('subjectId', 'name color');

        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json(note);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete a note
// @route DELETE /api/notes/:id
const deleteNote = async (req, res) => {
    try {
        const note = await Note.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        if (!note) return res.status(404).json({ message: 'Note not found' });
        res.json({ message: 'Note deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
