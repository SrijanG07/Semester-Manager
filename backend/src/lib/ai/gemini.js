/**
 * Google Gemini client — handles both text-only and multimodal (PDF) requests.
 * Uses gemini-2.5-flash for its large context window and native PDF support.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const MODEL_NAME = 'gemini-2.5-flash';

let genAI = null;

function getClient() {
    if (!genAI) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set in environment variables');
        }
        genAI = new GoogleGenerativeAI(apiKey);
    }
    return genAI;
}

/**
 * Call Gemini with text-only input.
 * @param {string} prompt - The prompt to send.
 * @param {boolean} jsonMode - If true, instruct the model to return JSON.
 * @returns {Promise<string>} The model's response text.
 */
async function callGeminiText(prompt, jsonMode = false) {
    const client = getClient();
    const generationConfig = {};
    if (jsonMode) {
        generationConfig.responseMimeType = 'application/json';
    }
    const model = client.getGenerativeModel({ model: MODEL_NAME, generationConfig });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

/**
 * Call Gemini with a PDF file (multimodal).
 * Downloads the PDF from the given URL and sends it inline.
 * @param {string} prompt - The text prompt.
 * @param {string} pdfUrl - Public URL of the PDF file.
 * @param {boolean} jsonMode - If true, instruct the model to return JSON.
 * @returns {Promise<string>} The model's response text.
 */
async function callGeminiWithPdf(prompt, pdfUrl, jsonMode = false) {
    const client = getClient();
    const generationConfig = {};
    if (jsonMode) {
        generationConfig.responseMimeType = 'application/json';
    }
    const model = client.getGenerativeModel({ model: MODEL_NAME, generationConfig });

    // Download the PDF
    const response = await fetch(pdfUrl);
    if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString('base64');

    // Determine MIME type from response headers or default to PDF
    const contentType = response.headers.get('content-type') || 'application/pdf';

    const result = await model.generateContent([
        { text: prompt },
        {
            inlineData: {
                mimeType: contentType,
                data: base64Data,
            },
        },
    ]);

    return result.response.text();
}

module.exports = {
    callGeminiText,
    callGeminiWithPdf,
    MODEL_NAME,
};
