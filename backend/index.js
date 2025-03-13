import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import cors from 'cors';
import { uploadFile } from './storage.js';
import { processPdfWithGemini } from './gemini.js';
import { GoogleAuth } from 'google-auth-library';

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

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

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

    if (!geminiResponse || geminiResponse.error) {
      return res.status(500).json({ error: geminiResponse.error || 'Failed to process PDF' });
    }

    res.status(200).json({
      message: 'Upload and processing successful',
      extractedData: geminiResponse,
    });
  } catch (error) {
    console.error('❌ Server error:', error);
    res.status(500).json({ error: 'Server failed to process file' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend is working!');
});

async function startServer() {
  await getAccessToken();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

startServer();