import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  _id: string;
  senderId: mongoose.Types.ObjectId;
  senderAccount: string;
  receiverAccount: string;
  amount: number;
  type: 'internal' | 'external';
  status: 'pending' | 'completed' | 'failed';
  narration?: string;
  completedAt?: Date;
  completedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender ID is required']
  },
  senderAccount: {
    type: String,
    required: [true, 'Sender account is required'],
    match: [/^\d{10}$/, 'Sender account must be 10 digits']
  },
  receiverAccount: {
    type: String,
    required: [true, 'Receiver account is required'],
    match: [/^\d{10}$/, 'Receiver account must be 10 digits']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0'],
    max: [1000000, 'Amount cannot exceed $1,000,000']
  },
  type: {
    type: String,
    enum: {
      values: ['internal', 'external'],
      message: 'Type must be either internal or external'
    },
    required: [true, 'Transaction type is required']
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'failed'],
      message: 'Status must be pending, completed, or failed'
    },
    default: 'pending'
  },
  narration: {
    type: String,
    maxlength: [500, 'Narration cannot exceed 500 characters'],
    trim: true
  },
  completedAt: Date,
  completedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Indexes for better performance
TransactionSchema.index({ senderId: 1 });
TransactionSchema.index({ senderAccount: 1 });
TransactionSchema.index({ receiverAccount: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ createdAt: -1 });

// Export the model
export default mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema);