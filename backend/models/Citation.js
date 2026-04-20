import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema({
  rapportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rapport', required: true },
  type: { type: String, enum: ['article', 'book', 'web', 'other'], default: 'article' },
  format: { type: String, enum: ['APA', 'IEEE', 'MLA'], default: 'APA' },
  data: {
    authors: [String],
    title: String,
    year: String,
    publisher: String,
    journal: String,
    url: String,
    doi: String
  },
  shortLabel: String, // e.g. [1] or (Jaballi, 2024)
  fullReference: String // The formatted string
}, { timestamps: true });

const Citation = mongoose.model('Citation', citationSchema);
export default Citation;
