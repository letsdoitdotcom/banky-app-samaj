import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  idNumber: string;
  verified: boolean;
  emailVerified: boolean;
  approved: boolean;
  accountNumber?: string;
  balance: number;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  zipCode: { type: String, required: true },
  country: { type: String, required: true }
});

const UserSchema = new Schema<IUser>({
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
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^\+?[\d\s\-\(\)]+$/, 'Please enter a valid phone number']
  },
  address: {
    type: AddressSchema,
    required: [true, 'Address is required']
  },
  idNumber: {
    type: String,
    required: [true, 'ID number is required'],
    unique: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  approved: {
    type: Boolean,
    default: false
  },
  accountNumber: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^\d{10}$/, 'Account number must be 10 digits']
  },
  balance: {
    type: Number,
    default: 50.00, // $50 welcome bonus for new users
    min: [0, 'Balance cannot be negative']
  },
  verificationToken: String,
  verificationTokenExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
}, {
  timestamps: true
});

// Indexes for better performance
UserSchema.index({ email: 1 });
UserSchema.index({ accountNumber: 1 });
UserSchema.index({ verified: 1, approved: 1 });
UserSchema.index({ verificationToken: 1 });
UserSchema.index({ passwordResetToken: 1 });

// Generate account number before saving
UserSchema.methods.generateAccountNumber = function() {
  const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
  return accountNumber;
};

// Export the model
export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);