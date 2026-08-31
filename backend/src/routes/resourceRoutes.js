const express = require('express');
const multer = require('multer');
const {
    createResource, getResources, getResource, updateResource,
    deleteResource, toggleCompletion, linkPersonalNotes, uploadFile,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Use memory storage for serverless compatibility (Vercel has read-only filesystem)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

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

module.exports = router;
