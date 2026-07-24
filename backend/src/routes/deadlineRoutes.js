const express = require('express');
const {
    createDeadline, getDeadlines, getUrgentDeadlines, updateDeadline, markComplete, deleteDeadline,
} = require('../controllers/deadlineController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createDeadline);
router.get('/', protect, getDeadlines);
router.get('/urgent', protect, getUrgentDeadlines);
router.put('/:deadlineId', protect, updateDeadline);
router.patch('/:deadlineId/complete', protect, markComplete);
router.delete('/:deadlineId', protect, deleteDeadline);

module.exports = router;
