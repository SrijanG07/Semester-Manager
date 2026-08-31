const Resource = require('../models/Resource');
const supabase = require('../config/supabase');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const BUCKET_NAME = 'sem';

// @desc Create resource (file or link)
// @route POST /api/subjects/:id/resources
const createResource = async (req, res) => {
    try {
        const { title, type, fileUrl, externalLink, topicId, tags } = req.body;
        const resource = await Resource.create({
            subjectId: req.params.id,
            topicId, title, type, fileUrl, externalLink,
            tags: tags || [],
        });
        res.status(201).json(resource);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get resources for subject
// @route GET /api/subjects/:id/resources
const getResources = async (req, res) => {
    try {
        const { type, completed, topicId } = req.query;
        const filter = { subjectId: req.params.id };

        if (type) filter.type = type;
        if (completed !== undefined) filter.completed = completed === 'true';
        if (topicId) filter.topicId = topicId;

        const resources = await Resource.find(filter)
            .populate('topicId', 'name')
            .sort({ uploadDate: -1 });

        res.json(resources);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get single resource
// @route GET /api/resources/:resourceId
const getResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.resourceId)
            .populate('subjectId', 'name')
            .populate('topicId', 'name');
        if (!resource) return res.status(404).json({ message: 'Resource not found' });
        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update resource
// @route PUT /api/resources/:resourceId
const updateResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.resourceId, req.body, { new: true, runValidators: true }
        );
        if (!resource) return res.status(404).json({ message: 'Resource not found' });
        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete resource
// @route DELETE /api/resources/:resourceId
const deleteResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.resourceId);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        if (resource.firebaseStoragePath) {
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([resource.firebaseStoragePath]);
            if (error) console.error('Failed to delete from Supabase Storage:', error.message);
        }

        await Resource.findByIdAndDelete(req.params.resourceId);
        res.json({ message: 'Resource deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Toggle completion status
// @route PATCH /api/resources/:resourceId/complete
const toggleCompletion = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.resourceId);
        if (!resource) return res.status(404).json({ message: 'Resource not found' });

        resource.completed = !resource.completed;
        await resource.save();
        res.json(resource);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Link personal notes to class notes
// @route POST /api/resources/:resourceId/link-notes
const linkPersonalNotes = async (req, res) => {
    try {
        const { personalNotesId } = req.body;
        const classNote = await Resource.findById(req.params.resourceId);
        if (!classNote) return res.status(404).json({ message: 'Class note not found' });

        classNote.hasPersonalNotes = true;
        classNote.personalNotesId = personalNotesId;
        await classNote.save();
        res.json(classNote);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Upload file to Supabase Storage
// @route POST /api/upload
const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const originalName = req.file.originalname || 'file';
        const ext = path.extname(originalName);
        const uniqueName = `${uuidv4()}${ext}`;
        const storagePath = `uploads/${uniqueName}`;

        const fileBuffer = req.file.buffer || (req.file.path && fs.existsSync(req.file.path) ? fs.readFileSync(req.file.path) : null);

        if (!fileBuffer) {
            return res.status(400).json({ message: 'Failed to read file buffer' });
        }

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        // Clean up temp file if any exists
        if (req.file.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        if (uploadError) throw new Error(uploadError.message);

        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);

        res.json({
            url: urlData.publicUrl,
            storagePath,
            format: ext.replace('.', ''),
            size: req.file.size,
        });
    } catch (error) {
        if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error('Supabase Storage upload error:', error.message);
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createResource, getResources, getResource, updateResource,
    deleteResource, toggleCompletion, linkPersonalNotes, uploadFile,
};
