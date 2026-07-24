/**
 * Groq client — fast text-only inference using llama-3.3-70b-versatile.
 * Used as fallback/secondary provider for quiz & flashcard generation
 * from existing summaries (not raw PDFs).
 */
const Groq = require('groq-sdk');

const MODEL_NAME = 'llama-3.1-8b-instant';

let groqClient = null;

function getClient() {
    if (!groqClient) {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            throw new Error('GROQ_API_KEY is not set in environment variables');
        }
        groqClient = new Groq({ apiKey });
    }
    return groqClient;
}

/**
 * Call Groq with text-only input.
 * @param {string} prompt - The prompt to send (system + user combined, or just user).
 * @param {boolean} jsonMode - If true, use JSON response format.
 * @returns {Promise<string>} The model's response text.
 */
async function callGroqText(prompt, jsonMode = false) {
    const client = getClient();

    const requestBody = {
        model: MODEL_NAME,
        messages: [
            {
                role: 'user',
                content: prompt,
            },
        ],
        temperature: 0.7,
        max_tokens: 8192,
    };

    if (jsonMode) {
        requestBody.response_format = { type: 'json_object' };
    }

    const completion = await client.chat.completions.create(requestBody);
    return completion.choices[0]?.message?.content || '';
}

module.exports = {
    callGroqText,
    MODEL_NAME,
};
