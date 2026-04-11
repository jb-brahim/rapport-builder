import mongoose from 'mongoose';

const shareTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true }, // signed JWT
  rapportId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rapport', required: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null }
}, { timestamps: true });

const ShareToken = mongoose.model('ShareToken', shareTokenSchema);
export default ShareToken;
