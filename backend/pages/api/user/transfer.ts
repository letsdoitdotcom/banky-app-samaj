import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Transaction from '../../../models/Transaction';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import Joi from 'joi';

// Validation schema
const transferSchema = Joi.object({
  receiverAccount: Joi.string().length(10).required(),
  amount: Joi.number().positive().max(1000000).required(),
  type: Joi.string().valid('internal', 'external').required(),
  narration: Joi.string().max(500).optional(),
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const userId = req.user?.userId;
    const userAccountNumber = req.user?.accountNumber;

    if (!userId || !userAccountNumber) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const { error, value } = transferSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map((d: any) => d.message) 
      });
    }

    const { receiverAccount, amount, type, narration } = value;

    // Check if trying to transfer to same account
    if (receiverAccount === userAccountNumber) {
      return res.status(400).json({ error: 'Cannot transfer to your own account' });
    }

    // For internal transfers, verify receiver account exists
    if (type === 'internal') {
      const receiverUser = await User.findOne({ 
        accountNumber: receiverAccount, 
        approved: true 
      });

      if (!receiverUser) {
        return res.status(400).json({ error: 'Receiver account not found or not approved' });
      }
    }

    // Get current user and check balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if sufficient balance (for simulation purposes)
    if (user.balance < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        currentBalance: user.balance,
        requestedAmount: amount,
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      senderId: userId,
      senderAccount: userAccountNumber,
      receiverAccount,
      amount,
      type,
      status: 'pending',
      narration: narration || '',
    });

    await transaction.save();

    res.status(201).json({
      message: 'Transfer initiated successfully. Status: Pending Confirmation.',
      transaction: {
        id: transaction._id,
        senderAccount: userAccountNumber,
        receiverAccount,
        amount,
        type,
        status: 'pending',
        narration: narration || '',
        createdAt: transaction.createdAt,
      },
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('user')(handler);