const express = require('express');
const {
    createStudySession, getStudySessions, getStudyStats, updateStudySession, deleteStudySession,
} = require('../controllers/studyController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/', protect, createStudySession);
router.get('/', protect, getStudySessions);
router.get('/stats', protect, getStudyStats);
router.put('/:sessionId', protect, updateStudySession);
router.delete('/:sessionId', protect, deleteStudySession);

module.exports = router;
