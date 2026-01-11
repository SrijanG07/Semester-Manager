import express from 'express';
import {
    createSubject,
    getSubjects,
    getSubject,
    updateSubject,
    deleteSubject,
} from '../controllers/subjectController';
import {
    setGradingScheme,
    getGradingScheme,
    addScore,
    getScores,
    calculateScore,
    updateScore,
    deleteScore,
} from '../controllers/gradingController';
import { protect } from '../middleware/auth';

const router = express.Router();

// Subject routes
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

// Score management
router.put('/scores/:scoreId', protect, updateScore);
router.delete('/scores/:scoreId', protect, deleteScore);

export default router;
