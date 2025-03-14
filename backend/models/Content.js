import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Placeholder until Week 7 authentication
  uploadId: { type: String, required: true, unique: true }, // Unique file identifier
  originalContent: { type: String, required: true }, // Gemini-extracted Markdown
  editedContent: { type: String }, // User-edited Markdown (optional initially)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Content', ContentSchema);