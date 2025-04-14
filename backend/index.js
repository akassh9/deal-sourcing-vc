import dotenv from 'dotenv';
dotenv.config({ path: './.env' }); // Ensure path is correct if .env is not in root

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import { uploadFile } from './storage.js';
import { processPdfWithGemini } from './gemini.js';
import { GoogleAuth } from 'google-auth-library';
import Content from './models/Content.js'; // Make sure path is correct
import { generateInvestmentMemo } from './geminiMemo.js'; // Make sure path is correct
import { validateMemoContent } from './validation.js'; // Make sure path is correct
import path from 'path'; // Needed for resolving keyfile path
import { fileURLToPath } from 'url'; // Needed for __dirname in ES modules

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve keyfile path relative to the current file's directory
const keyFilePath = path.join(__dirname, 'pitch-1739020848146-925095e8b054.json');

const auth = new GoogleAuth({
  keyFile: keyFilePath, // Use resolved path
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

async function getAccessToken() {
  try {
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token || !token.token) {
        throw new Error('Failed to retrieve access token.');
    }
    process.env.GOOGLE_ACCESS_TOKEN = token.token;
    console.log('Access Token refreshed successfully.'); // Add logging
    return token.token;
  } catch (error) {
      console.error('❌ Error getting access token:', error.message);
      // Decide if the app should exit or try again later
      // For now, we'll throw to prevent the server starting without auth
      throw new Error(`Could not get Google Access Token: ${error.message}`);
  }
}

// Refresh token periodically (e.g., every 45 minutes)
// Google access tokens typically last 1 hour. Refresh before expiry.
const TOKEN_REFRESH_INTERVAL = 45 * 60 * 1000; // 45 minutes in milliseconds
setInterval(async () => {
    console.log('Attempting periodic token refresh...');
    try {
        await getAccessToken();
    } catch (error) {
        console.error('❌ Periodic token refresh failed:', error.message);
        // Consider adding alerting or more robust retry logic here
    }
}, TOKEN_REFRESH_INTERVAL);


process.on('uncaughtException', (err, origin) => {
  console.error(`❌ Uncaught Exception at: ${origin}`, err);
  // Consider exiting the process for unknown errors
  // process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
  // Consider exiting or implementing more specific error handling
});

const app = express();
const PORT = process.env.PORT || 3001;

// CORS Configuration (consider making it more restrictive for production)
app.use(cors());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Handle URL-encoded bodies if needed

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      process.exit(1); // Exit if DB connection fails
  });

// Multer Configuration (Store in memory or handle temporary files more carefully)
// Using 'uploads/' might require manual cleanup. Consider memoryStorage for small files
// or more robust temporary file handling.
const upload = multer({ dest: 'uploads/' });
// const upload = multer({ storage: multer.memoryStorage() }); // Alternative: use memory


// --- API Endpoints ---

app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// Add 0cred verification endpoint
app.get('/0cred-verify', (req, res) => {
  res.send('<a2c06f5c-c891-4ea8-b23e-1244555c748b>');
});

// POST /upload
app.post('/upload', upload.single('file'), async (req, res) => {
  console.log('Received request on /upload');
  try {
    const file = req.file;
    if (!file) {
      console.log('Upload error: No file provided');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing file: ${file.originalname}, Path: ${file.path}`);
    const gcsPath = await uploadFile(file.path, file.originalname);
    console.log(`File uploaded to GCS: ${gcsPath}`);

    console.log('Processing PDF with Gemini...');
    const geminiResponse = await processPdfWithGemini(gcsPath);
    console.log('Gemini processing complete.');

    // Robust text extraction
    let extractedText = 'No text extracted.';
    if (geminiResponse && geminiResponse.candidates && geminiResponse.candidates.length > 0) {
        const parts = geminiResponse.candidates[0].content?.parts;
        if (parts && parts.length > 0 && parts[0].text) {
            extractedText = parts[0].text;
        }
    }

    // Save content to DB
    const content = new Content({
      userId: 'placeholder-user-id', // TODO: Replace with actual user ID later
      uploadId: file.originalname,
      originalContent: extractedText,
      // Mongoose default for createdAt/updatedAt will work here
    });
    await content.save();
    console.log(`Content saved to DB with ID: ${content._id}`);

    // TODO: Clean up temporary file from 'uploads/' directory if not using memoryStorage
    // import fs from 'fs/promises';
    // await fs.unlink(file.path);

    res.status(200).json({
      message: 'Upload and processing successful',
      contentId: content._id.toString(),
      uploadId: content.uploadId,
      // Send back only the extracted text, not the full Gemini response unless needed by frontend
      extractedText: extractedText,
    });
  } catch (error) {
    console.error('❌ Server error in /upload:', error);
    res.status(500).json({ error: 'Server failed to process file', details: error.message });
  }
});

// GET /content/:uploadId
app.get('/content/:uploadId', async (req, res) => {
  try {
    const uploadId = req.params.uploadId;
    console.log(`Received request on /content/${uploadId}`);
    const content = await Content.findOne({ uploadId: uploadId });
    if (!content) {
        console.log(`Content not found for uploadId: ${uploadId}`);
        return res.status(404).json({ error: 'Content not found' });
    }
    console.log(`Content found for uploadId: ${uploadId}`);
    res.status(200).json(content);
  } catch (error) {
    console.error(`❌ Error retrieving content for ${req.params.uploadId}:`, error);
    res.status(500).json({ error: 'Failed to retrieve content', details: error.message });
  }
});

// PUT /content/:uploadId
app.put('/content/:uploadId', async (req, res) => {
  try {
    const uploadId = req.params.uploadId;
    const { editedContent } = req.body;

    if (typeof editedContent !== 'string') {
        return res.status(400).json({ error: 'Invalid editedContent provided.' });
    }
    console.log(`Received PUT request on /content/${uploadId}`);

    const content = await Content.findOneAndUpdate(
      { uploadId: uploadId },
      // Use $set to ensure other fields are not accidentally removed
      // Rely on Mongoose middleware for updatedAt
      { $set: { editedContent: editedContent } },
      { new: true, runValidators: true } // Return updated doc, run schema validators
    );

    if (!content) {
        console.log(`Content not found for update: ${uploadId}`);
        return res.status(404).json({ error: 'Content not found' });
    }
    console.log(`Content updated successfully for: ${uploadId}`);
    res.status(200).json({ message: 'Content updated', content });
  } catch (error) {
    console.error(`❌ Error updating content for ${req.params.uploadId}:`, error);
    if (error.name === 'ValidationError') {
        res.status(400).json({ error: 'Validation failed', details: error.errors });
    } else {
        res.status(500).json({ error: 'Failed to update content', details: error.message });
    }
  }
});

// POST /generate-memo/:uploadId
app.post('/generate-memo/:uploadId', async (req, res) => {
  try {
    const uploadId = req.params.uploadId;
    console.log(`Received POST request on /generate-memo/${uploadId}`);

    const content = await Content.findOne({ uploadId: uploadId });
    if (!content) {
        console.log(`Content not found for memo generation: ${uploadId}`);
        return res.status(404).json({ error: 'Content not found' });
    }

    const sourceContent = content.editedContent || content.originalContent;
    if (!sourceContent || sourceContent.trim() === '') {
         console.log(`Source content is empty for memo generation: ${uploadId}`);
         return res.status(400).json({ error: 'Cannot generate memo from empty content.' });
    }

    console.log(`Generating memo for: ${uploadId}`);
    // Destructure only 'memo' as 'reasoning' is no longer needed/returned by the updated function
    const { memo, errorDetails } = await generateInvestmentMemo(sourceContent);

    // Check if memo generation itself resulted in an error state
    if (errorDetails || memo === 'Error generating memo.') {
         console.error(`❌ Memo generation failed internally for ${uploadId}:`, errorDetails);
         return res.status(500).json({ error: 'Failed to generate memo during API call', details: errorDetails });
    }

    // Update the content document in the database
    content.memo = memo;
    // REMOVED: content.reasoning = reasoning; // Don't save reasoning anymore
    // Rely on Mongoose middleware for updatedAt timestamp

    await content.save();
    console.log(`Memo generated and saved successfully for: ${uploadId}`);

    // Send response back to client (without reasoning)
    res.status(200).json({
      message: 'Memo generated successfully',
      memo: memo,
      // REMOVED: reasoning: reasoning
    });

  } catch (error) {
    console.error(`❌ Error in /generate-memo endpoint for ${req.params.uploadId}:`, error);
     if (error.name === 'ValidationError') {
        res.status(400).json({ error: 'Validation failed during save', details: error.errors });
    } else {
       res.status(500).json({ error: 'Failed to generate memo', details: error.message });
    }
  }
});

// POST /validate-memo-content
app.post('/validate-memo-content', async (req, res) => {
  try {
    const { query } = req.body;
     console.log(`Received POST request on /validate-memo-content with query: "${query ? query.substring(0, 50) : ''}..."`);

    if (!query || typeof query !== 'string' || query.trim() === '') {
      console.log('Validation error: Query text is required.');
      return res.status(400).json({ error: 'Query text is required.' });
    }

    const searchResults = await validateMemoContent(query);
    console.log(`Validation search returned ${searchResults.items?.length || 0} results.`);

    // Format results safely
    const formattedResults = searchResults?.items?.map(item => ({
          title: item.title || 'No Title',
          snippet: item.snippet || 'No Snippet',
          link: item.link || '#',
        })) || []; // Ensure it's always an array

    res.status(200).json({ results: formattedResults });
  } catch (error) {
    console.error("❌ Validation endpoint error:", error);
    res.status(500).json({ error: 'Failed to validate memo content.', details: error.message });
  }
});

// --- Server Start ---
async function startServer() {
  try {
    console.log('Initializing server...');
    await getAccessToken(); // Initial token fetch
    app.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
      console.log(`Access locally at http://localhost:${PORT}`);
    });
  } catch (error) {
      console.error('❌ Failed to start server:', error);
      process.exit(1); // Exit if initial setup fails
  }
}

startServer();