import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import connectDB from '../lib/db';
import Admin from '../models/Admin';

export async function seedDatabase() {
  try {
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: process.env.DEFAULT_ADMIN_EMAIL });
    
    if (!existingAdmin) {
      // Hash the default admin password
      const hashedPassword = await bcrypt.hash(process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 10);
      
      // Create default admin
      const defaultAdmin = new Admin({
        name: process.env.DEFAULT_ADMIN_NAME || 'System Administrator',
        email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@bankyapp.com',
        password: hashedPassword,
        role: 'superadmin'
      });

      await defaultAdmin.save();
      console.log('Default admin created successfully');
    } else {
      console.log('Default admin already exists');
    }

    // Create indexes
    await Admin.collection.createIndex({ email: 1 }, { unique: true });
    console.log('Admin indexes created');

  } catch (error) {
    console.error('Database seeding error:', error);
    throw error;
  }
}

// Helper function to generate unique account number
export async function generateUniqueAccountNumber(): Promise<string> {
  const User = (await import('../models/User')).default;
  
  let accountNumber: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate 10-digit account number
    accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    // Check if this account number already exists
    const existingAccount = await User.findOne({ accountNumber });
    isUnique = !existingAccount;
    attempts++;
  }

  if (!isUnique) {
    throw new Error('Failed to generate unique account number after maximum attempts');
  }

  return accountNumber!;
}