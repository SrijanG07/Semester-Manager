const express = require('express');
const {
    generateAiOutput,
    getOutputsForResource,
    getAiOutput,
    generateQuiz,
    generateFlashcards,
    saveQuizAttempt,
    getQuizAttempts,
    updateFlashcardProgress,
    getFlashcardProgress,
    getOutputsForSubject,
    getDueFlashcardsCount,
} = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Generate summary or explanation from a resource
router.post('/generate', generateAiOutput);

// Get AI outputs
router.get('/outputs/:resourceId', getOutputsForResource);
router.get('/output/:id', getAiOutput);
router.get('/subject/:subjectId', getOutputsForSubject);

// Quiz generation & attempts
router.post('/quiz', generateQuiz);
router.post('/quiz-attempt', saveQuizAttempt);
router.get('/quiz-attempts/:quizId', getQuizAttempts);

// Flashcard generation & progress
router.post('/flashcards', generateFlashcards);
router.post('/flashcard-progress', updateFlashcardProgress);
router.get('/flashcard-progress/:outputId', getFlashcardProgress);
router.get('/flashcards-due', getDueFlashcardsCount);

module.exports = router;
