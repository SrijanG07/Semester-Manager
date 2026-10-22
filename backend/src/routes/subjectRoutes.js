const { ownsRecord } = require('../middleware/ownership');
const express = require('express');
const {
    createSubject,
    getSubjects,
    getSemestersSummary,
    getSubject,
    updateSubject,
    deleteSubject,
    deleteSemester,
} = require('../controllers/subjectController');
const {
    setGradingScheme,
    getGradingScheme,
    addScore,
    getScores,
    calculateScore,
    updateScore,
    deleteScore,
} = require('../controllers/gradingController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Semester routes (must come before /:id)
router.get('/semesters/summary', protect, getSemestersSummary);
router.delete('/semesters/:semesterName', protect, deleteSemester);

// Subject CRUD routes
router.post('/', protect, createSubject);
router.get('/', protect, getSubjects);
router.get('/:id', protect, ownsRecord('Subject', 'id'), getSubject);
router.put('/:id', protect, ownsRecord('Subject', 'id'), updateSubject);
router.delete('/:id', protect, ownsRecord('Subject', 'id'), deleteSubject);

// Grading routes
router.post('/:id/grading', protect, ownsRecord('Subject', 'id'), setGradingScheme);
router.put('/:id/grading', protect, ownsRecord('Subject', 'id'), setGradingScheme);
router.get('/:id/grading', protect, ownsRecord('Subject', 'id'), getGradingScheme);

// Score routes
router.post('/:id/scores', protect, ownsRecord('Subject', 'id'), addScore);
router.get('/:id/scores', protect, ownsRecord('Subject', 'id'), getScores);
router.get('/:id/calculate', protect, ownsRecord('Subject', 'id'), calculateScore);
router.put('/scores/:scoreId', protect, ownsRecord('Score', 'scoreId'), updateScore);
router.delete('/scores/:scoreId', protect, ownsRecord('Score', 'scoreId'), deleteScore);

module.exports = router;
