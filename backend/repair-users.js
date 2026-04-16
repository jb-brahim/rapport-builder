import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const repair = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB...');

    // 1. Fix Admin
    const admin = await User.findOne({ email: 'admin@rapporti.com' });
    if (admin) {
      admin.passwordHash = 'adminpassword123';
      admin.role = 'admin';
      await admin.save();
      console.log('Admin password reset to: adminpassword123');
    }

    // 2. Fix Student
    const student = await User.findOne({ email: 'student@example.com' });
    if (student) {
      student.passwordHash = 'studentpassword123';
      await student.save();
      console.log('Student password reset to: studentpassword123');
    }

    // 3. Create a more "obvious" admin if preferred
    const obviousAdmin = await User.findOne({ email: 'admin@rapport.com' });
    if (!obviousAdmin) {
      await User.create({
        email: 'admin@rapport.com',
        passwordHash: 'adminpassword123',
        role: 'admin',
        profile: { name: 'Admin Rapport' }
      });
      console.log('Created admin@rapport.com with adminpassword123');
    }

    console.log('Repair complete!');
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

repair();
