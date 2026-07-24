/**
 * AI Provider Abstraction Layer
 * 
 * Single entry point for all AI calls. Routes to Gemini or Groq based on
 * the task type, handles retry/fallback on rate limits.
 * 
 * Usage:
 *   const { generateFromPdf, generateFromText } = require('./provider');
 *   const summary = await generateFromPdf(prompt, pdfUrl);
 *   const quiz = await generateFromText(prompt, { jsonMode: true });
 */
const gemini = require('./gemini');
const groq = require('./groq');

const RETRY_DELAY_MS = 2000;

/**
 * Sleep helper for retry delays.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is a rate-limit (429) error.
 */
function isRateLimitError(error) {
    return (
        error?.status === 429 ||
        error?.statusCode === 429 ||
        error?.code === 429 ||
        error?.message?.includes('429') ||
        error?.message?.toLowerCase()?.includes('rate limit') ||
        error?.message?.toLowerCase()?.includes('resource exhausted') ||
        error?.message?.toLowerCase()?.includes('quota')
    );
}

/**
 * Generate content from a PDF file (multimodal).
 * 
 * Uses Gemini (only provider that supports direct PDF input).
 * Retries once on 429, but cannot fall back to Groq since Groq doesn't accept PDFs.
 * 
 * @param {string} prompt - The text prompt.
 * @param {string} pdfUrl - Public URL of the PDF file.
 * @param {Object} options
 * @param {boolean} [options.jsonMode=false] - Request JSON response.
 * @returns {Promise<{ text: string, model: string }>}
 */
async function generateFromPdf(prompt, pdfUrl, options = {}) {
    const { jsonMode = false } = options;

    try {
        const text = await gemini.callGeminiWithPdf(prompt, pdfUrl, jsonMode);
        return { text, model: gemini.MODEL_NAME };
    } catch (error) {
        // Retry once on rate limit
        if (isRateLimitError(error)) {
            console.warn(`[AI Provider] Gemini rate limited, retrying in ${RETRY_DELAY_MS}ms...`);
            await sleep(RETRY_DELAY_MS);
            try {
                const text = await gemini.callGeminiWithPdf(prompt, pdfUrl, jsonMode);
                return { text, model: gemini.MODEL_NAME };
            } catch (retryError) {
                // Cannot fall back to Groq for PDF tasks
                throw new Error(
                    'AI service is busy. Gemini rate limit exceeded and PDF processing requires Gemini. Please try again in a moment.'
                );
            }
        }
        throw error;
    }
}

/**
 * Generate content from text input (no PDF).
 * 
 * Tries Gemini first, falls back to Groq on rate limit.
 * Used for quiz/flashcard generation from existing summaries.
 * 
 * @param {string} prompt - The text prompt.
 * @param {Object} options
 * @param {boolean} [options.jsonMode=false] - Request JSON response.
 * @param {string} [options.preferredProvider='gemini'] - 'gemini' or 'groq'.
 * @returns {Promise<{ text: string, model: string }>}
 */
async function generateFromText(prompt, options = {}) {
    const { jsonMode = false, preferredProvider = 'gemini' } = options;

    // If Groq is preferred (or Gemini key not set), go straight to Groq
    if (preferredProvider === 'groq' || !process.env.GEMINI_API_KEY) {
        try {
            const text = await groq.callGroqText(prompt, jsonMode);
            return { text, model: groq.MODEL_NAME };
        } catch (error) {
            if (isRateLimitError(error)) {
                throw new Error('AI service is busy, try again in a moment.');
            }
            throw error;
        }
    }

    // Try Gemini first
    try {
        const text = await gemini.callGeminiText(prompt, jsonMode);
        return { text, model: gemini.MODEL_NAME };
    } catch (error) {
        if (isRateLimitError(error)) {
            console.warn('[AI Provider] Gemini rate limited, falling back to Groq...');
            await sleep(RETRY_DELAY_MS);

            // Retry Gemini once
            try {
                const text = await gemini.callGeminiText(prompt, jsonMode);
                return { text, model: gemini.MODEL_NAME };
            } catch (retryError) {
                // Fall back to Groq
                if (process.env.GROQ_API_KEY) {
                    console.warn('[AI Provider] Gemini retry failed, using Groq fallback.');
                    try {
                        const text = await groq.callGroqText(prompt, jsonMode);
                        return { text, model: groq.MODEL_NAME };
                    } catch (groqError) {
                        throw new Error('AI service is busy, try again in a moment.');
                    }
                }
                throw new Error('AI service is busy, try again in a moment.');
            }
        }
        throw error;
    }
}

module.exports = {
    generateFromPdf,
    generateFromText,
};
