// ./models/Content.js
import mongoose from 'mongoose';

const ContentSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
    // Consider adding index: true if you query by userId frequently
  },
  uploadId: {
    type: String,
    required: true,
    unique: true, // Keep this, good practice
    index: true     // Add index for faster lookups by uploadId
  },
  originalContent: {
    type: String,
    required: true
  },
  editedContent: {
    type: String
    // No change needed here
  },
  memo: {
    type: String
    // No change needed here
  },
  reasoning: {
    // --- CHANGE IS HERE ---
    // type: String, // Old type - could not store objects
    type: mongoose.Schema.Types.Mixed, // New type - allows storing objects, strings, null, etc.
    // --- END CHANGE ---
    required: false // Keep as false unless reasoning is absolutely mandatory
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
});

// Optional but recommended: Automatically update the 'updatedAt' timestamp on updates
ContentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Need middleware for findOneAndUpdate as used in your index.js
ContentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: Date.now() });
  next();
});


export default mongoose.model('Content', ContentSchema);