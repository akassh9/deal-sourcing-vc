// backend/validation.js
import axios from 'axios';

/**
 * Validates memo content by performing a Google CSE search.
 * @param {string} query - The memo text or selected snippet to validate.
 * @returns {object} - The search results from Google CSE.
 */
export async function validateMemoContent(query) {
  const apiKey = process.env.GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cseId}&q=${encodeURIComponent(query)}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    console.error(
      'Error validating memo content:',
      error.response ? error.response.data : error.message
    );
    throw error;
  }
}
