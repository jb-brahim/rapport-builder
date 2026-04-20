import mongoose from 'mongoose';

const rapportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  supervisorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template' },
  currentStep: { type: Number, min: 1, max: 12, default: 1 },
  stepCompletion: { 
    type: [Number],
    default: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  chaptersConfig: { type: [Object], default: [] },
  wizardAnswers: { type: Object, default: {} },
  visualLayout: { type: Array, default: [] },
  numPages: { type: Number, default: 3 },
  sectionLocks: { type: Map, of: Boolean, default: new Map() },
  status: { type: String, enum: ['draft', 'in_review', 'final'], default: 'draft' },
  lastSavedAt: { type: Date, default: Date.now },
  activeViewers: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastActive: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

// Middleware to update lastSavedAt on any change
rapportSchema.pre('save', function(next) {
  this.lastSavedAt = Date.now();
  next();
});
rapportSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastSavedAt: Date.now() });
  next();
});

const Rapport = mongoose.model('Rapport', rapportSchema);
export default Rapport;
