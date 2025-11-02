// Production Admin Seeding Script
// This runs against the production MongoDB database

const mongoose = require('mongoose');

// Use production MongoDB URI directly
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://username:password@cluster.mongodb.net/bankyapp?retryWrites=true&w=majority";

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: {
      values: ['superadmin', 'staff'],
      message: 'Role must be either superadmin or staff'
    },
    default: 'staff'
  },
  lastLogin: Date
}, {
  timestamps: true
});

const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

async function seedProductionAdmin() {
  try {
    console.log('🔄 Connecting to production MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to production MongoDB');

    // Delete existing admin if any (to ensure clean state)
    await Admin.deleteMany({ email: 'Matt015014@gmail.com' });
    console.log('🗑️ Cleared existing admin accounts');

    // Hash the password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    // Create new admin
    const newAdmin = new Admin({
      name: 'System Administrator',
      email: 'Matt015014@gmail.com',
      password: hashedPassword,
      role: 'superadmin'
    });

    await newAdmin.save();
    
    console.log('🎉 Production admin created successfully!');
    console.log('   Email:', newAdmin.email);
    console.log('   Name:', newAdmin.name);
    console.log('   Role:', newAdmin.role);
    console.log('   ID:', newAdmin._id);
    
    // Verify the admin can be found and password works
    const foundAdmin = await Admin.findOne({ email: 'Matt015014@gmail.com' }).select('+password');
    if (foundAdmin) {
      const passwordTest = await bcrypt.compare('admin123', foundAdmin.password);
      console.log('✅ Verification: Admin found and password works:', passwordTest);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedProductionAdmin();