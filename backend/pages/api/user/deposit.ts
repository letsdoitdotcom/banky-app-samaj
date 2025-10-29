import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Transaction from '../../../models/Transaction';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import { depositRateLimit } from '../../../middleware/rateLimit';
import Joi from 'joi';

// Validation schema for deposit
const depositSchema = Joi.object({
  amount: Joi.number().positive().max(10000).required().messages({
    'number.base': 'Amount must be a valid number',
    'number.positive': 'Amount must be greater than zero',
    'number.max': 'Maximum deposit amount is $10,000',
    'any.required': 'Please enter a deposit amount'
  }),
  description: Joi.string().allow('').max(200).default('Bank Deposit')
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

    // Apply rate limiting
    await depositRateLimit(req, res, () => {});

    // Validate request body
    const { error, value } = depositSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0]?.message || 'Invalid deposit data'
      });
    }

    const { amount, description } = value;

    // Use MongoDB session for atomic transaction
    const session = await User.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Get current user and update balance
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error('User not found');
        }

        if (!user.approved) {
          throw new Error('Account not approved for transactions');
        }

        // Update user balance
        const newBalance = user.balance + amount;
        await User.findByIdAndUpdate(
          userId,
          { balance: newBalance },
          { session }
        );

        // Create transaction record
        const transaction = new Transaction({
          type: 'deposit',
          amount: amount,
          senderAccount: 'BANK_DEPOSIT',
          receiverAccount: userAccountNumber,
          senderId: null, // Bank deposit has no sender
          receiverId: userId,
          senderName: 'Bank Deposit',
          receiverName: user.name,
          narration: description,
          status: 'completed',
          transactionId: `DEP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        });

        await transaction.save({ session });

        res.status(200).json({
          success: true,
          message: 'Deposit processed successfully',
          transaction: {
            id: transaction._id,
            amount: amount,
            newBalance: newBalance,
            type: 'deposit',
            status: 'completed',
            transactionId: transaction.transactionId,
            createdAt: transaction.createdAt
          }
        });
      });
    } catch (transactionError: any) {
      throw new Error(transactionError.message || 'Transaction failed');
    } finally {
      await session.endSession();
    }

  } catch (error: any) {
    console.error('Deposit error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process deposit'
    });
  }
}

export default authMiddleware('user')(handler);