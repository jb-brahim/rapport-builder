import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const restore = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');

    const email = 'brahimjaballi@gmail.com';
    const password = 'brahim123';

    // Delete existing if any (unlikely but safe)
    await User.deleteOne({ email });

    const user = await User.create({
      email,
      passwordHash: password, // Pre-save hook will hash it
      role: 'admin',
      profile: {
        name: 'Brahim Jaballi',
        university: 'Engineering School'
      }
    });

    console.log(`✅ User ${email} restored with Admin role!`);
    process.exit();
  } catch (error) {
    console.error('Failed to restore user:', error);
    process.exit(1);
  }
};

restore();
