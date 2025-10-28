import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Transaction from '../../../models/Transaction';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import { transferPerUserRateLimit } from '../../../middleware/rateLimit';
import { sanitizeAccountNumber, sanitizeNarration } from '../../../utils/sanitize';
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

  // Apply rate limiting for transfers
  return new Promise<void>((resolve, reject) => {
    transferPerUserRateLimit(req, res, async () => {
      try {
        await handleTransfer(req, res);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function handleTransfer(req: AuthenticatedRequest, res: NextApiResponse) {

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

    // Sanitize inputs
    const sanitizedReceiverAccount = sanitizeAccountNumber(receiverAccount);
    const sanitizedNarration = sanitizeNarration(narration || '');

    // Check if trying to transfer to same account
    if (sanitizedReceiverAccount === userAccountNumber) {
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

    // Use MongoDB session for atomic transaction to prevent race conditions
    const session = await User.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Get current user and check balance (within transaction)
        const user = await User.findById(userId).session(session);
        if (!user) {
          throw new Error('User not found');
        }

        // Check if sufficient balance
        if (user.balance < amount) {
          throw new Error(`Insufficient balance. Available: ${user.balance}, Requested: ${amount}`);
        }

        // For internal transfers, update both balances atomically
        if (type === 'internal') {
          const receiverUser = await User.findOne({ 
            accountNumber: sanitizedReceiverAccount, 
            approved: true 
          }).session(session);

          if (!receiverUser) {
            throw new Error('Receiver account not found or not approved');
          }

          // Deduct from sender
          await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: -amount } },
            { session }
          );

          // Add to receiver
          await User.findByIdAndUpdate(
            receiverUser._id,
            { $inc: { balance: amount } },
            { session }
          );

          // Create completed transaction record
          const transaction = new Transaction({
            senderId: userId,
            senderAccount: userAccountNumber,
            receiverAccount: sanitizedReceiverAccount,
            amount,
            type,
            status: 'completed',
            narration: sanitizedNarration,
            completedAt: new Date(),
          });

          await transaction.save({ session });
          return transaction;
        } else {
          // External transfer - just deduct and create pending transaction
          await User.findByIdAndUpdate(
            userId,
            { $inc: { balance: -amount } },
            { session }
          );

          const transaction = new Transaction({
            senderId: userId,
            senderAccount: userAccountNumber,
            receiverAccount: sanitizedReceiverAccount,
            amount,
            type,
            status: 'pending',
            narration: sanitizedNarration,
          });

          await transaction.save({ session });
          return transaction;
        }
      });
    } catch (error: any) {
      return res.status(400).json({ 
        error: error.message || 'Transaction failed'
      });
    } finally {
      await session.endSession();
    }

    // Get the updated transaction for response
    const latestTransaction = await Transaction.findOne({
      senderId: userId,
      senderAccount: userAccountNumber,
      receiverAccount: sanitizedReceiverAccount,
      amount,
    }).sort({ createdAt: -1 });

    if (!latestTransaction) {
      return res.status(500).json({ error: 'Transaction processing error' });
    }

    const statusMessage = type === 'internal' 
      ? 'Transfer completed successfully!'
      : 'Transfer initiated successfully. Status: Pending External Processing.';

    res.status(201).json({
      message: statusMessage,
      transaction: {
        id: latestTransaction._id,
        senderAccount: userAccountNumber,
        receiverAccount: sanitizedReceiverAccount,
        amount,
        type,
        status: latestTransaction.status,
        narration: sanitizedNarration,
        createdAt: latestTransaction.createdAt,
        completedAt: latestTransaction.completedAt,
      },
    });

  } catch (error) {
    console.error('Transfer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('user')(handler);