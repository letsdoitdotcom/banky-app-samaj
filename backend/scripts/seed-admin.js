const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Simple Admin schema for seeding
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

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@bankyapp.com' 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin account already exists:', existingAdmin.email);
      console.log('   Name:', existingAdmin.name);
      console.log('   Role:', existingAdmin.role);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(
      process.env.DEFAULT_ADMIN_PASSWORD || 'admin123', 
      10
    );
    
    // Create default admin
    const defaultAdmin = new Admin({
      name: process.env.DEFAULT_ADMIN_NAME || 'System Administrator',
      email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@bankyapp.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    await defaultAdmin.save();
    
    console.log('🎉 Default admin created successfully!');
    console.log('   Email:', defaultAdmin.email);
    console.log('   Name:', defaultAdmin.name);
    console.log('   Role:', defaultAdmin.role);
    console.log('   Password:', process.env.DEFAULT_ADMIN_PASSWORD || 'admin123');
    
    console.log('\n🔐 Admin Login Details:');
    console.log('   URL: http://localhost:3000/admin-login');
    console.log('   Email:', defaultAdmin.email);
    console.log('   Password:', process.env.DEFAULT_ADMIN_PASSWORD || 'admin123');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the seeding
seedAdmin();