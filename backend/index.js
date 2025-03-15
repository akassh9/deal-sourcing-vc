import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import { uploadFile } from './storage.js';
import { processPdfWithGemini } from './gemini.js';
import { GoogleAuth } from 'google-auth-library';
import Content from './models/Content.js';
import { generateInvestmentMemo } from './groq.js';

const auth = new GoogleAuth({
  keyFile: './pitch-1739020848146-925095e8b054.json',
  scopes: 'https://www.googleapis.com/auth/cloud-platform'
});

async function getAccessToken() {
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  process.env.GOOGLE_ACCESS_TOKEN = token.token;
  return token.token;
}

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json()); // Add this to parse JSON bodies for PUT requests

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const upload = multer({ dest: 'uploads/' });

app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const gcsPath = await uploadFile(file.path, file.originalname);
    const geminiResponse = await processPdfWithGemini(gcsPath);
    const extractedText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || 'No text extracted';

    const content = new Content({
      userId: 'placeholder-user-id',
      uploadId: file.originalname, // "Kecha Pitch Deck.pdf"
      originalContent: extractedText,
    });
    await content.save();

    res.status(200).json({
      message: 'Upload and processing successful',
      contentId: content._id,
      uploadId: content.uploadId,
      extractedData: geminiResponse,
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Server failed to process file' });
  }
});

// GET content by uploadId
app.get('/content/:uploadId', async (req, res) => {
  try {
    const content = await Content.findOne({ uploadId: req.params.uploadId });
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.status(200).json(content);
  } catch (error) {
    console.error('❌ Error retrieving content:', error);
    res.status(500).json({ error: 'Failed to retrieve content' });
  }
});

// PUT update edited content
app.put('/content/:uploadId', async (req, res) => {
  try {
    const { editedContent } = req.body;
    const content = await Content.findOneAndUpdate(
      { uploadId: req.params.uploadId },
      { editedContent, updatedAt: Date.now() },
      { new: true } // Return the updated document
    );
    if (!content) return res.status(404).json({ error: 'Content not found' });
    res.status(200).json({ message: 'Content updated', content });
  } catch (error) {
    console.error('❌ Error updating content:', error);
    res.status(500).json({ error: 'Failed to update content' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend is working!');
});

// NEW ENDPOINT: Generate memo
app.post('/generate-memo/:uploadId', async (req, res) => {
  try {
    const content = await Content.findOne({ uploadId: req.params.uploadId });
    if (!content) return res.status(404).json({ error: 'Content not found' });

    const editedContent = content.editedContent || content.originalContent;
    const { memo, reasoning } = await generateInvestmentMemo(editedContent);

    // Update the content document
    content.memo = memo;
    content.reasoning = reasoning;
    content.updatedAt = Date.now();
    await content.save();

    res.status(200).json({ 
      message: 'Memo generated successfully', 
      memo, 
      reasoning 
    });
  } catch (error) {
    console.error('❌ Error generating memo:', error);
    res.status(500).json({ error: 'Failed to generate memo' });
  }
});

async function startServer() {
  await getAccessToken();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();