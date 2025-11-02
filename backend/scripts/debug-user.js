const mongoose = require('mongoose');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://letsdoitdotcom_db_user:cr8CSZjgXyyGcUU2@bankky-app-samaj.czhksss.mongodb.net/bankyapp?retryWrites=true&w=majority&appName=bankky-app-samaj";

async function debugUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Define User schema directly
    const userSchema = new mongoose.Schema({
      name: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      emailVerified: { type: Boolean, default: false },
      verified: { type: Boolean, default: false },
      approved: { type: Boolean, default: false },
      verificationToken: String,
      verificationTokenExpires: Date,
    });
    
    const User = mongoose.model('User', userSchema);

    const email = 'Federalaidprogram@gmail.com';
    
    console.log(`\n🔍 Searching for user: ${email}`);
    
    // Find user with exact email match
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    if (user) {
      console.log('\n✅ User found:');
      console.log('ID:', user._id);
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('EmailVerified:', user.emailVerified);
      console.log('Verified:', user.verified);
      console.log('Approved:', user.approved);
      console.log('VerificationToken:', user.verificationToken ? 'EXISTS' : 'NONE');
      console.log('VerificationTokenExpires:', user.verificationTokenExpires);
      
      if (user.verificationTokenExpires) {
        const now = new Date();
        const expired = user.verificationTokenExpires < now;
        console.log('Token Expired:', expired);
        console.log('Current Time:', now);
        console.log('Token Expires:', user.verificationTokenExpires);
      }
      
    } else {
      console.log('❌ No user found with email:', email);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

debugUser();