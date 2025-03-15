import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID;
const LOCATION = 'us-central1';
const GEMINI_MODEL_URL = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/gemini-2.0-flash-lite-001:generateContent`;

export async function processPdfWithGemini(gcsUri) {
  try {
    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: 'Extract key details from this PDF file and provide a structured summary.' },
            { fileData: { mimeType: 'application/pdf', fileUri: gcsUri } }
          ]
        }
      ]
    };

    const extractResponse = await axios.post(
      GEMINI_MODEL_URL,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GOOGLE_ACCESS_TOKEN}`
        }
      }
    );

    return extractResponse.data;
  } catch (error) {
    console.error('❌ ERROR: Processing PDF with Gemini failed:', error.response?.data || error.message);
    throw error;
  }
}