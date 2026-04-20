import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: false },
  googleId: { type: String, unique: true, sparse: true },
  role: { type: String, enum: ['student', 'supervisor', 'faculty', 'admin'], default: 'student' },
  profile: {
    name: { type: String, required: true },
    photoUrl: { type: String },
    bio: { type: String },
    university: { type: String },
    dept: { type: String },
    year: { type: String }
  },
  language: { type: String, enum: ['FR', 'EN', 'AR'], default: 'FR' },
  contributorBadge: { type: Boolean, default: false },
  writingStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveAt: { type: Date }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.passwordHash || !this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.passwordHash);
};

const User = mongoose.model('User', userSchema);
export default User;
