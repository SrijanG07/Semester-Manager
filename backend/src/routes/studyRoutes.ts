import express from 'express';
import {
    createStudySession,
    getStudySessions,
    getStudyStats,
    updateStudySession,
    deleteStudySession,
} from '../controllers/studyController';
import { protect } from '../middleware/auth';

const router = express.Router();

router.post('/', protect, createStudySession);
router.get('/', protect, getStudySessions);
router.get('/stats', protect, getStudyStats);
router.put('/:sessionId', protect, updateStudySession);
router.delete('/:sessionId', protect, deleteStudySession);

export default router;
