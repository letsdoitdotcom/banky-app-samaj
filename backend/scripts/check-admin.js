const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Simple Admin schema
const AdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['superadmin', 'staff'], default: 'superadmin' },
  lastLogin: Date
}, {
  timestamps: true
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function checkAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find admin user
    const admin = await Admin.findOne({ 
      email: 'admin@bankyapp.com' 
    }).select('+password');
    
    if (!admin) {
      console.log('❌ Admin user NOT found in database!');
      return;
    }

    console.log('✅ Admin user found:');
    console.log('   ID:', admin._id);
    console.log('   Name:', admin.name);
    console.log('   Email:', admin.email);
    console.log('   Role:', admin.role);
    console.log('   Password hash length:', admin.password.length);
    console.log('   Password starts with:', admin.password.substring(0, 10) + '...');
    console.log('   Created:', admin.createdAt);
    console.log('   Last Login:', admin.lastLogin);

    // Test password comparison
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare('admin123', admin.password);
    console.log('   Password comparison result:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Password comparison failed!');
      console.log('   This means the stored hash does not match "admin123"');
    } else {
      console.log('✅ Password comparison successful!');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

checkAdminUser();