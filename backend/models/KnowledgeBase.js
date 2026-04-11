import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema({
  type: { type: String, enum: ['sector', 'methodology', 'vocab', 'phrase', 'citation'], required: true },
  sector: [{ type: String }],
  domain: [{ type: String }],
  tags: [{ type: String }],
  content: {
    FR: { type: String, default: '' },
    EN: { type: String, default: '' },
    AR: { type: String, default: '' }
  },
  originalHash: { type: String, required: true } // for plagiarism distance checks
}, { timestamps: true });

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
export default KnowledgeBase;
