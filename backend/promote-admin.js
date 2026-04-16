import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const promoteUser = async (email) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found');
      process.exit(1);
    }
    
    user.role = 'admin';
    await user.save();
    
    console.log(`User ${email} promoted to admin successfully!`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const email = process.argv[2] || 'brahimjaballi@gmail.com';
promoteUser(email);
