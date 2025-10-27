import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'superadmin' | 'staff';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema = new Schema<IAdmin>({
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

// Indexes for better performance
AdminSchema.index({ email: 1 });

// Export the model
export default mongoose.models.Admin || mongoose.model<IAdmin>('Admin', AdminSchema);