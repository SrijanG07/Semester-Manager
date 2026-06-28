import { Response } from 'express';
import Resource from '../models/Resource';
import supabase from '../config/supabase';
import { AuthRequest } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'resources';

// @desc Create resource (file or link)
// @route POST /api/subjects/:id/resources
export const createResource = async (req: AuthRequest, res: Response) => {
    try {
        const { title, type, fileUrl, externalLink, topicId, tags } = req.body;

        const resource = await Resource.create({
            subjectId: req.params.id,
            topicId,
            title,
            type,
            fileUrl,
            externalLink,
            tags: tags || [],
        });

        res.status(201).json(resource);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get resources for subject
// @route GET /api/subjects/:id/resources
export const getResources = async (req: AuthRequest, res: Response) => {
    try {
        const { type, completed, topicId } = req.query;

        const filter: any = { subjectId: req.params.id };

        if (type) filter.type = type;
        if (completed !== undefined) filter.completed = completed === 'true';
        if (topicId) filter.topicId = topicId;

        const resources = await Resource.find(filter)
            .populate('topicId', 'name')
            .sort({ uploadDate: -1 });

        res.json(resources);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get single resource
// @route GET /api/resources/:resourceId
export const getResource = async (req: AuthRequest, res: Response) => {
    try {
        const resource = await Resource.findById(req.params.resourceId)
            .populate('subjectId', 'name')
            .populate('topicId', 'name');

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        res.json(resource);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update resource
// @route PUT /api/resources/:resourceId
export const updateResource = async (req: AuthRequest, res: Response) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.resourceId,
            req.body,
            { new: true, runValidators: true }
        );

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        res.json(resource);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete resource
// @route DELETE /api/resources/:resourceId
export const deleteResource = async (req: AuthRequest, res: Response) => {
    try {
        const resource = await Resource.findById(req.params.resourceId);

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Delete file from Supabase Storage if exists
        if (resource.firebaseStoragePath) {
            const { error } = await supabase.storage
                .from(BUCKET_NAME)
                .remove([resource.firebaseStoragePath]);
            if (error) {
                console.error('Failed to delete from Supabase Storage:', error.message);
            }
        }

        await Resource.findByIdAndDelete(req.params.resourceId);
        res.json({ message: 'Resource deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Toggle completion status
// @route PATCH /api/resources/:resourceId/complete
export const toggleCompletion = async (req: AuthRequest, res: Response) => {
    try {
        const resource = await Resource.findById(req.params.resourceId);

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        resource.completed = !resource.completed;
        await resource.save();

        res.json(resource);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Link personal notes to class notes
// @route POST /api/resources/:resourceId/link-notes
export const linkPersonalNotes = async (req: AuthRequest, res: Response) => {
    try {
        const { personalNotesId } = req.body;

        const classNote = await Resource.findById(req.params.resourceId);

        if (!classNote) {
            return res.status(404).json({ message: 'Class note not found' });
        }

        classNote.hasPersonalNotes = true;
        classNote.personalNotesId = personalNotesId;
        await classNote.save();

        res.json(classNote);
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Upload file to Supabase Storage
// @route POST /api/upload
export const uploadFile = async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const originalName = req.file.originalname || 'file';
        const ext = path.extname(originalName);
        const uniqueName = `${uuidv4()}${ext}`;
        const storagePath = `uploads/${uniqueName}`;

        const fileBuffer = fs.readFileSync(req.file.path);

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(storagePath, fileBuffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        // Clean up temp file
        if (fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        if (uploadError) {
            throw new Error(uploadError.message);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(storagePath);

        res.json({
            url: urlData.publicUrl,
            storagePath,
            format: ext.replace('.', ''),
            size: req.file.size,
        });
    } catch (error: any) {
        // Clean up temp file on error too
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        console.error('Supabase Storage upload error:', error.message);
        res.status(500).json({ message: error.message });
    }
};
