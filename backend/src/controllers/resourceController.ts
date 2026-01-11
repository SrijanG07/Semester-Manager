import { Response } from 'express';
import Resource from '../models/Resource';
import cloudinary from '../config/cloudinary';
import { AuthRequest } from '../middleware/auth';

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

        // Delete file from Cloudinary if exists
        if (resource.fileUrl) {
            const publicId = resource.fileUrl.split('/').pop()?.split('.')[0];
            if (publicId) {
                await cloudinary.uploader.destroy(publicId);
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

// @desc Upload file to Cloudinary
// @route POST /api/upload
export const uploadFile = async (req: any, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'semester-manager',
            resource_type: 'auto',
        });

        res.json({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
