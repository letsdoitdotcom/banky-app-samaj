import connectDB from '../lib/db';
import Admin from '../models/Admin';
import { hashPassword } from '../lib/auth';

async function updateAdminEmail() {
  try {
    await connectDB();
    
    console.log('🔍 Looking for existing admin...');
    const existingAdmin = await Admin.findOne({});
    
    if (existingAdmin) {
      console.log('📧 Updating admin email from:', existingAdmin.email);
      existingAdmin.email = 'Matt015014@gmail.com';
      existingAdmin.name = 'Matt Johnson';
      await existingAdmin.save();
      console.log('✅ Admin email updated successfully to: Matt015014@gmail.com');
    } else {
      console.log('➕ Creating new admin account...');
      const hashedPassword = await hashPassword('admin123');
      const newAdmin = new Admin({
        name: 'Matt Johnson',
        email: 'Matt015014@gmail.com',
        password: hashedPassword,
        role: 'superadmin'
      });
      await newAdmin.save();
      console.log('✅ New admin created: Matt015014@gmail.com');
    }
  } catch (error) {
    console.error('❌ Error updating admin:', error);
  }
}

// Run the update
updateAdminEmail();