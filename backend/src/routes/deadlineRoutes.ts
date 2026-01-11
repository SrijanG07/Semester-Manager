import express from 'express';
import {
    createDeadline,
    getDeadlines,
    getUrgentDeadlines,
    updateDeadline,
    markComplete,
    deleteDeadline,
} from '../controllers/deadlineController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/', protect, createDeadline);
router.get('/', protect, getDeadlines);
router.get('/urgent', protect, getUrgentDeadlines);
router.put('/:deadlineId', protect, updateDeadline);
router.patch('/:deadlineId/complete', protect, markComplete);
router.delete('/:deadlineId', protect, deleteDeadline);

export default router;
