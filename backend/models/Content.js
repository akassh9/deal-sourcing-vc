import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  uploadId: { type: String, required: true, unique: true },
  originalContent: { type: String, required: true },
  editedContent: { type: String },
  memo: { type: String }, // Store the generated memo
  reasoning: { type: String }, // Store the reasoning steps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model('Content', ContentSchema);