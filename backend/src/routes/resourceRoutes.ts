import express from 'express';
import multer from 'multer';
import {
    createResource,
    getResources,
    getResource,
    updateResource,
    deleteResource,
    toggleCompletion,
    linkPersonalNotes,
    uploadFile,
} from '../controllers/resourceController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Resource routes (attached to subjects)
router.post('/:id/resources', protect, createResource);
router.get('/:id/resources', protect, getResources);

// Resource management
router.get('/resources/:resourceId', protect, getResource);
router.put('/resources/:resourceId', protect, updateResource);
router.delete('/resources/:resourceId', protect, deleteResource);
router.patch('/resources/:resourceId/complete', protect, toggleCompletion);
router.post('/resources/:resourceId/link-notes', protect, linkPersonalNotes);

// File upload
router.post('/upload', protect, upload.single('file'), uploadFile);

export default router;
