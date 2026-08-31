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
router.get('/:id', protect, getSubject);
router.put('/:id', protect, updateSubject);
router.delete('/:id', protect, deleteSubject);

// Grading routes
router.post('/:id/grading', protect, setGradingScheme);
router.put('/:id/grading', protect, setGradingScheme);
router.get('/:id/grading', protect, getGradingScheme);

// Score routes
router.post('/:id/scores', protect, addScore);
router.get('/:id/scores', protect, getScores);
router.get('/:id/calculate', protect, calculateScore);
router.put('/scores/:scoreId', protect, updateScore);
router.delete('/scores/:scoreId', protect, deleteScore);

module.exports = router;
