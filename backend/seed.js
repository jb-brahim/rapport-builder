import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Rapport from './models/Rapport.js';
import Template from './models/Template.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Rapport.deleteMany({});
    await Template.deleteMany({});
    console.log('Cleared existing data.');

    // 1. Create Admin User
    const adminPassword = 'adminpassword123';
    const admin = await User.create({
      email: 'admin@rapporti.com',
      passwordHash: adminPassword,
      role: 'admin',
      profile: {
        name: 'System Administrator',
        university: 'Rappori Global',
        dept: 'Engineering'
      }
    });
    console.log('Admin user created: admin@rapporti.com / adminpassword123');

    // 2. Create Student User
    const studentPassword = 'studentpassword123';
    const student = await User.create({
      email: 'student@example.com',
      passwordHash: studentPassword,
      role: 'student',
      profile: {
        name: 'Amine Trabelsi',
        university: 'ISSAT Sousse',
        dept: 'Génie Logiciel',
        year: '2024'
      }
    });
    console.log('Student user created: student@example.com / studentpassword123');

    // 3. Create a Template
    const template = await Template.create({
      name: 'PFE Standard Tunisien',
      university: 'Universités de Tunisie',
      language: 'FR',
      status: 'approved',
      schema: {
        sections: [
          { id: 'intro', title: 'Introduction Générale' },
          { id: 'ch1', title: 'Chapitre 1: Présentation du Projet' },
          { id: 'ch2', title: 'Chapitre 2: État de l\'Art' },
          { id: 'conclusion', title: 'Conclusion' }
        ]
      }
    });
    console.log('Sample template created.');

    // 4. Create a Rapport for the student
    const rapport = await Rapport.create({
      userId: student._id,
      templateId: template._id,
      currentStep: 5,
      stepCompletion: [100, 100, 100, 100, 50, 0, 0, 0, 0, 0, 0, 0],
      wizardAnswers: {
        projectTitle: 'Gestion de Stock Intelligente',
        companyName: 'TechSolutions Tunisia',
        objective: 'Optimiser la gestion des stocks avec l\'IA.'
      },
      visualLayout: [
        { id: 'main-title', type: 'text', content: 'RAPPORT DE PROJET DE FIN D\'ÉTUDES', fontSize: 24, bold: true },
        { id: 'project-desc', type: 'text', content: 'Le présent rapport expose le développement d\'une solution innovante...', fontSize: 12 }
      ],
      status: 'draft'
    });
    console.log('Sample rapport created for the student.');

    console.log('Seeding complete! 🚀');
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
