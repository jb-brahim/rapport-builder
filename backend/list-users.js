import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from './models/User.js';

dotenv.config();

const listUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected...');
    
    const users = await User.find({}).select('email role');
    console.log('Current Users:');
    console.table(users.map(u => ({ email: u.email, role: u.role })));
    
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

listUsers();
