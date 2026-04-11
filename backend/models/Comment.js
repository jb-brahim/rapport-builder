import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  rapportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rapport', required: true },
  sectionId: { type: String, required: true }, // Not an ObjectId, just string ID of the section in JSON
  authorName: { type: String, required: true }, // No account required for reviewers
  text: { type: String, required: true },
  thread: [{
    authorName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  status: { type: String, enum: ['open', 'approved', 'revision', 'question'], default: 'open' }
}, { timestamps: true });

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;
