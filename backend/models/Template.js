import mongoose from 'mongoose';

const templateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  university: { type: String },
  country: { type: String },
  language: { type: String, enum: ['FR', 'EN', 'AR'], default: 'FR' },
  schema: { type: Object, required: true }, // JSON schema for sections & rules
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const Template = mongoose.model('Template', templateSchema);
export default Template;
