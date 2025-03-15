import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = process.env.GROQ_API_KEY;

export async function generateInvestmentMemo(content) {
  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: 'qwen-qwq-32b',
        messages: [
          { role: 'system', content: 'You are an expert investor generating an investment memo.' },
          { role: 'user', content: `Generate an investment memo based on this content:\n${content}` }
        ],
        reasoning_format: 'parsed',
        temperature: 0.6,
        top_p: 0.95
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        }
      }
    );

    const memo = response.data.choices[0].message.content;
    const reasoning = response.data.choices[0].message.reasoning || 'No reasoning provided';

    return { memo, reasoning };
  } catch (error) {
    console.error('❌ ERROR: Generating memo with Groq failed:', error.response?.data || error.message);
    throw error;
  }
}