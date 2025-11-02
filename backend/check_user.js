const mongoose = require('mongoose');
require('dotenv').config();

async function checkUser() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://username:password@cluster.mongodb.net/bankyapp?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Define the User schema directly in JS
    const UserSchema = new mongoose.Schema({
      name: String,
      email: String,
      password: String,
      phone: String,
      address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: String
      },
      idNumber: String,
      verified: Boolean,
      emailVerified: Boolean,
      approved: Boolean,
      accountNumber: String,
      balance: Number,
      verificationToken: String,
      verificationTokenExpires: Date
    }, { timestamps: true });

    const User = mongoose.models.User || mongoose.model('User', UserSchema);

    const user = await User.findOne({ email: 'matt015014@gmail.com' });
    if (user) {
      console.log('\n=== USER DATA ===');
      console.log('Name:', user.name);
      console.log('Email:', user.email);
      console.log('Account Number:', user.accountNumber);
      console.log('Balance:', user.balance);
      console.log('Balance Type:', typeof user.balance);
      console.log('Verified:', user.verified);
      console.log('Approved:', user.approved);
      console.log('ID Number:', user.idNumber);
      console.log('Address:', user.address);
      console.log('Created At:', user.createdAt);
      console.log('\n=== RAW USER OBJECT ===');
      console.log(JSON.stringify(user, null, 2));
    } else {
      console.log('User not found!');
    }

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUser();