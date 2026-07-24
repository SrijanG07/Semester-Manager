const express = require('express');
const {
    createTopic, getTopics, getTopic, updateTopic, updateTopicStatus, deleteTopic, getWeakTopics,
} = require('../controllers/topicController');
const { protect } = require('../middleware/auth');

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

module.exports = router;
