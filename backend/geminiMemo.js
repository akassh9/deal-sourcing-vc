// backend/geminiMemo.js
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
// IMPORTANT: Verify the exact identifier in Vertex AI Model Garden.
const GEMINI_MODEL_ID = process.env.GEMINI_MODEL_ID || 'gemini-2.0-flash-001'; // <<< Use the correct 2.0 model ID
const GEMINI_MEMO_MODEL_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${GEMINI_MODEL_ID}:generateContent`;

/**
 * Generates an investment memo using Gemini 2.0 Flash with Google Search as a tool.
 * This version focuses on returning only the generated memo text.
 *
 * @param {string} content - The source text for generating the memo.
 * @returns {Promise<{memo: string, errorDetails?: object | null}>} - The generated memo or an error object.
 */
export async function generateInvestmentMemo(content) {
  if (!PROJECT_ID || !process.env.GOOGLE_ACCESS_TOKEN || !LOCATION) {
    console.error('ERROR: GOOGLE_CLOUD_PROJECT_ID, GOOGLE_ACCESS_TOKEN, and GOOGLE_CLOUD_LOCATION environment variables must be set.');
    throw new Error('Missing required environment variables.');
  }

  // Check if the chosen model ID looks like a 2.0 model
  if (!GEMINI_MODEL_ID.includes('2.0')) {
      console.warn(`WARN: Configured model ID "${GEMINI_MODEL_ID}" does not explicitly mention "2.0". Ensure this model supports the 'googleSearch: {}' tool structure.`);
  }

  try {
    const promptText = `You are an expert investor tasked with generating a concise investment memo.
Structure the memo with the following sections: **Value Proposition**, **Market Opportunity**, **Financials**, and **Risks**.
Base your memo solely on the following content:
${content}

When citing data (such as market size, competitor analysis, or factual discrepancies), you MUST use Google Search to verify the information and include appropriate citations in the format [1], [2], etc. List the sources corresponding to these numbers at the end under a **Sources** section. If you cannot verify a specific piece of data via search, state that clearly in the sources list.`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: promptText }]
        }
      ],
      // Use the 'googleSearch' tool structure
      tools: [
        {
          "googleSearch": {}
        }
      ],
      generationConfig: {
        // temperature: 0.7,
        // maxOutputTokens: 1024,
      },
    };

    console.log('--- Sending Request to Vertex AI ---');
    console.log('URL:', GEMINI_MEMO_MODEL_URL);
    console.log('Using Model ID:', GEMINI_MODEL_ID);
    // console.log('Full Request Body:', JSON.stringify(requestBody, null, 2)); // Keep commented unless needed

    const response = await axios.post(
      GEMINI_MEMO_MODEL_URL,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`
        }
      }
    );

    console.log('\n--- Received Response from Vertex AI ---');
    console.log('Response Status:', response.status);

    // Extract the main memo text.
    const candidate = response.data.candidates?.[0];
    const memo = candidate?.content?.parts?.[0]?.text || 'No memo generated';

    // Log if grounding metadata was present, just for debugging, but don't process/return it
    if (candidate?.groundingMetadata) {
        console.log('>>> Grounding Metadata was present in the response (not returned). Keys:', Object.keys(candidate.groundingMetadata));
    } else {
         console.log('>>> Grounding Metadata not found in the response.');
    }

    console.log('\n--- Generated Memo (first 100 chars) ---');
    console.log(memo.substring(0, 100) + '...');

    // Return only the memo
    return { memo };

  } catch (error) {
    // Keep existing error handling
    console.error('\nERROR: Generating memo with Gemini failed.');
    if (error.response) {
      console.error('API Status:', error.response.status);
      console.error('API Data:', JSON.stringify(error.response.data, null, 2));
       // Check specifically for tool-related errors
       if (error.response.status === 400) {
           const errorMsg = error.response.data?.error?.message || '';
           if (errorMsg.includes('does not support tools') || errorMsg.includes('tool is not supported')) {
               console.error(`ERROR HINT: Model "${GEMINI_MODEL_ID}" might not support the 'tools: [{ "googleSearch": {} }]' structure or any tools. Verify model capabilities.`);
           } else if (errorMsg.includes('Invalid tool')) {
                console.error(`ERROR HINT: The structure 'tools: [{ "googleSearch": {} }]' might be invalid for this model/API version. Check Vertex AI documentation for the correct tool schema.`);
           }
       }
       if (error.response.status === 403) {
         console.error('Potential Permission Issue: Ensure the service account or user has roles like "Vertex AI User" and that the Vertex AI API is enabled.');
      }
    } else {
      console.error('Error Message:', error.message);
    }
    // Return error structure (without reasoning field)
    return {
        memo: 'Error generating memo.',
        errorDetails: error.response ? error.response.data : { message: error.message }
    };
  }
}