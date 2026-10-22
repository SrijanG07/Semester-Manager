const { ownsRecord } = require('../middleware/ownership');
const express = require('express');
const {
    createTopic, getTopics, getTopic, updateTopic, updateTopicStatus, deleteTopic, getWeakTopics,
} = require('../controllers/topicController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Topic routes (attached to subjects)
router.post('/:id/topics', protect, ownsRecord('Subject', 'id'), createTopic);
router.get('/:id/topics', protect, ownsRecord('Subject', 'id'), getTopics);
router.get('/:id/weak-topics', protect, ownsRecord('Subject', 'id'), getWeakTopics);

// Topic management
router.get('/topics/:topicId', protect, ownsRecord('Topic', 'topicId'), getTopic);
router.put('/topics/:topicId', protect, ownsRecord('Topic', 'topicId'), updateTopic);
router.patch('/topics/:topicId/status', protect, ownsRecord('Topic', 'topicId'), updateTopicStatus);
router.delete('/topics/:topicId', protect, ownsRecord('Topic', 'topicId'), deleteTopic);

module.exports = router;
