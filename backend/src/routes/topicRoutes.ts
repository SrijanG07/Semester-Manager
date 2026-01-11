import express from 'express';
import {
    createTopic,
    getTopics,
    getTopic,
    updateTopic,
    updateTopicStatus,
    deleteTopic,
    getWeakTopics,
} from '../controllers/topicController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Topic routes (attached to subjects)
router.post('/:id/topics', protect, createTopic);
router.get('/:id/topics', protect, getTopics);
router.get('/:id/weak-topics', protect, getWeakTopics);

// Topic management
router.get('/topics/:topicId', protect, getTopic);
router.put('/topics/:topicId', protect, updateTopic);
router.patch('/topics/:topicId/status', protect, updateTopicStatus);
router.delete('/topics/:topicId', protect, deleteTopic);

export default router;
