const AiOutput = require('../models/AiOutput');
const FlashcardProgress = require('../models/FlashcardProgress');
const QuizAttempt = require('../models/QuizAttempt');
const Resource = require('../models/Resource');
const { generateFromPdf, generateFromText } = require('../lib/ai/provider');
const {
    getSummaryPrompt,
    getExplainPrompt,
    getQuizPrompt,
    getFlashcardPrompt,
} = require('../lib/ai/prompts');

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Parse JSON from LLM response, stripping markdown fences if present.
 */
function parseJsonResponse(text) {
    let cleaned = text.trim();
    // Strip markdown code fences
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
    }
    return JSON.parse(cleaned);
}

/**
 * Wrap controller logic with consistent error handling.
 */
function handleAiError(res, error) {
    console.error('[AI Controller Error]', error.message || error);
    if (
        error.message?.includes('AI service is busy') ||
        error.message?.includes('rate limit') ||
        error.message?.includes('429')
    ) {
        return res.status(429).json({
            message: 'AI service is busy, try again in a moment.',
        });
    }
    if (error.message?.includes('API_KEY')) {
        return res.status(500).json({
            message: 'AI service is not configured. Please set API keys.',
        });
    }
    return res.status(500).json({
        message: error.message || 'An error occurred while processing your request.',
    });
}

// ─── Generate Summary / Explanation ─────────────────────────────────────

// @desc Generate summary or explanation from a resource's PDF
// @route POST /api/ai/generate
const generateAiOutput = async (req, res) => {
    try {
        const { resourceId, type } = req.body;

        if (!resourceId || !['summary', 'explanation'].includes(type)) {
            return res.status(400).json({
                message: 'resourceId and type (summary|explanation) are required.',
            });
        }

        // Get the resource
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            return res.status(404).json({ message: 'Resource not found.' });
        }

        if (!resource.fileUrl) {
            return res.status(400).json({
                message: 'This resource has no uploaded file to analyze.',
            });
        }

        // Pick the right prompt
        const prompt = type === 'summary' ? getSummaryPrompt() : getExplainPrompt();

        // Call Gemini with the PDF
        const { text, model } = await generateFromPdf(prompt, resource.fileUrl);

        // Save to database
        const aiOutput = await AiOutput.create({
            resourceId,
            userId: req.user._id,
            type,
            content: text,
            modelUsed: model,
        });

        res.status(201).json(aiOutput);
    } catch (error) {
        handleAiError(res, error);
    }
};

// ─── Get AI Outputs for a Resource ──────────────────────────────────────

// @desc Get all AI outputs for a resource
// @route GET /api/ai/outputs/:resourceId
const getOutputsForResource = async (req, res) => {
    try {
        const outputs = await AiOutput.find({
            resourceId: req.params.resourceId,
            userId: req.user._id,
        }).sort({ createdAt: -1 });

        res.json(outputs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get a single AI output
// @route GET /api/ai/output/:id
const getAiOutput = async (req, res) => {
    try {
        const output = await AiOutput.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!output) {
            return res.status(404).json({ message: 'AI output not found.' });
        }

        res.json(output);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Generate Quiz ──────────────────────────────────────────────────────

// @desc Generate quiz from an existing summary/explanation
// @route POST /api/ai/quiz
const generateQuiz = async (req, res) => {
    try {
        const { sourceOutputId, difficulty = 'medium', questionCount = 10 } = req.body;

        if (!sourceOutputId) {
            return res.status(400).json({
                message: 'sourceOutputId is required.',
            });
        }

        // Get the source summary/explanation
        const sourceOutput = await AiOutput.findOne({
            _id: sourceOutputId,
            userId: req.user._id,
        });

        if (!sourceOutput) {
            return res.status(404).json({ message: 'Source output not found.' });
        }

        if (!['summary', 'explanation'].includes(sourceOutput.type)) {
            return res.status(400).json({
                message: 'Quizzes can only be generated from summaries or explanations.',
            });
        }

        // Build prompt with source content (truncate to ~6000 chars to stay within token limits)
        const sourceContent = typeof sourceOutput.content === 'string'
            ? sourceOutput.content.slice(0, 6000)
            : JSON.stringify(sourceOutput.content).slice(0, 6000);

        const prompt = getQuizPrompt(difficulty, questionCount) +
            '\n\n--- STUDY MATERIAL ---\n\n' +
            sourceContent;

        // Use text-only generation (cheaper, faster — source is already extracted text)
        const { text, model } = await generateFromText(prompt, {
            jsonMode: true,
            preferredProvider: 'gemini',
        });

        const parsed = parseJsonResponse(text);

        // Validate structure
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('Invalid quiz format returned by AI.');
        }

        // Save quiz
        const aiOutput = await AiOutput.create({
            resourceId: sourceOutput.resourceId,
            userId: req.user._id,
            type: 'quiz',
            content: parsed,
            modelUsed: model,
            sourceOutputId,
        });

        res.status(201).json(aiOutput);
    } catch (error) {
        handleAiError(res, error);
    }
};

// ─── Generate Flashcards ────────────────────────────────────────────────

// @desc Generate flashcards from an existing summary/explanation
// @route POST /api/ai/flashcards
const generateFlashcards = async (req, res) => {
    try {
        const { sourceOutputId, cardCount = 20 } = req.body;

        if (!sourceOutputId) {
            return res.status(400).json({
                message: 'sourceOutputId is required.',
            });
        }

        // Get the source summary/explanation
        const sourceOutput = await AiOutput.findOne({
            _id: sourceOutputId,
            userId: req.user._id,
        });

        if (!sourceOutput) {
            return res.status(404).json({ message: 'Source output not found.' });
        }

        if (!['summary', 'explanation'].includes(sourceOutput.type)) {
            return res.status(400).json({
                message: 'Flashcards can only be generated from summaries or explanations.',
            });
        }

        // Build prompt with source content (truncate to ~6000 chars to stay within token limits)
        const sourceContent = typeof sourceOutput.content === 'string'
            ? sourceOutput.content.slice(0, 6000)
            : JSON.stringify(sourceOutput.content).slice(0, 6000);

        const prompt = getFlashcardPrompt(cardCount) +
            '\n\n--- STUDY MATERIAL ---\n\n' +
            sourceContent;

        const { text, model } = await generateFromText(prompt, {
            jsonMode: true,
            preferredProvider: 'gemini',
        });

        const parsed = parseJsonResponse(text);

        // Validate structure
        if (!parsed.cards || !Array.isArray(parsed.cards)) {
            throw new Error('Invalid flashcard format returned by AI.');
        }

        // Save flashcards
        const aiOutput = await AiOutput.create({
            resourceId: sourceOutput.resourceId,
            userId: req.user._id,
            type: 'flashcards',
            content: parsed,
            modelUsed: model,
            sourceOutputId,
        });

        res.status(201).json(aiOutput);
    } catch (error) {
        handleAiError(res, error);
    }
};

// ─── Quiz Attempts ──────────────────────────────────────────────────────

// @desc Save a quiz attempt
// @route POST /api/ai/quiz-attempt
const saveQuizAttempt = async (req, res) => {
    try {
        const { aiOutputId, score, total, answers } = req.body;

        if (!aiOutputId || score === undefined || !total) {
            return res.status(400).json({
                message: 'aiOutputId, score, and total are required.',
            });
        }

        const attempt = await QuizAttempt.create({
            aiOutputId,
            userId: req.user._id,
            score,
            total,
            answers: answers || [],
        });

        res.status(201).json(attempt);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get quiz attempts for a quiz
// @route GET /api/ai/quiz-attempts/:quizId
const getQuizAttempts = async (req, res) => {
    try {
        const attempts = await QuizAttempt.find({
            aiOutputId: req.params.quizId,
            userId: req.user._id,
        }).sort({ takenAt: -1 });

        res.json(attempts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Flashcard Progress ─────────────────────────────────────────────────

// @desc Update flashcard progress (spaced repetition)
// @route POST /api/ai/flashcard-progress
const updateFlashcardProgress = async (req, res) => {
    try {
        const { aiOutputId, cardIndex, ease } = req.body;

        if (!aiOutputId || cardIndex === undefined || !ease) {
            return res.status(400).json({
                message: 'aiOutputId, cardIndex, and ease are required.',
            });
        }

        if (!['again', 'good', 'easy'].includes(ease)) {
            return res.status(400).json({
                message: 'ease must be one of: again, good, easy.',
            });
        }

        // Find or create progress record
        let progress = await FlashcardProgress.findOne({
            aiOutputId,
            cardIndex,
            userId: req.user._id,
        });

        const now = new Date();

        if (!progress) {
            progress = new FlashcardProgress({
                aiOutputId,
                cardIndex,
                userId: req.user._id,
                ease,
                interval: 0,
                dueDate: now,
                lastReviewedAt: now,
            });
        }

        // Update spaced repetition values
        progress.ease = ease;
        progress.lastReviewedAt = now;

        switch (ease) {
            case 'again':
                progress.interval = 1; // 1 day
                break;
            case 'good':
                progress.interval = Math.max(1, (progress.interval || 1) * 2);
                break;
            case 'easy':
                progress.interval = Math.max(4, (progress.interval || 1) * 3);
                break;
        }

        // Set next due date
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + progress.interval);
        progress.dueDate = dueDate;

        await progress.save();
        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Get flashcard progress for a set
// @route GET /api/ai/flashcard-progress/:outputId
const getFlashcardProgress = async (req, res) => {
    try {
        const progress = await FlashcardProgress.find({
            aiOutputId: req.params.outputId,
            userId: req.user._id,
        }).sort({ cardIndex: 1 });

        res.json(progress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get all AI outputs for a subject ───────────────────────────────────

// @desc Get all AI outputs for all resources in a subject
// @route GET /api/ai/subject/:subjectId
const getOutputsForSubject = async (req, res) => {
    try {
        // Get all resource IDs for this subject
        const resources = await Resource.find({
            subjectId: req.params.subjectId,
        }).select('_id');

        const resourceIds = resources.map((r) => r._id);

        const outputs = await AiOutput.find({
            resourceId: { $in: resourceIds },
            userId: req.user._id,
        })
            .populate('resourceId', 'title type')
            .sort({ createdAt: -1 });

        res.json(outputs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get due flashcards count ───────────────────────────────────────────

// @desc Get count of flashcards due for review
// @route GET /api/ai/flashcards-due
const getDueFlashcardsCount = async (req, res) => {
    try {
        const now = new Date();
        const count = await FlashcardProgress.countDocuments({
            userId: req.user._id,
            dueDate: { $lte: now },
        });

        res.json({ dueCount: count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
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
};
