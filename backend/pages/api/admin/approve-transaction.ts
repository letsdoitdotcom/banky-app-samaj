import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import Transaction from '../../../models/Transaction';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import Joi from 'joi';

// Validation schema
const approvalSchema = Joi.object({
  transactionId: Joi.string().required().messages({
    'any.required': 'Transaction ID is required'
  }),
  action: Joi.string().valid('approve', 'reject').required().messages({
    'any.only': 'Action must be either approve or reject',
    'any.required': 'Action is required'
  }),
  adminComment: Joi.string().optional().max(500).messages({
    'string.max': 'Admin comment cannot exceed 500 characters'
  })
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const adminId = req.user?.userId;
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const { error, value } = approvalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0]?.message || 'Invalid request data'
      });
    }

    const { transactionId, action, adminComment } = value;

    // Find the pending transaction
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.status !== 'pending') {
      return res.status(400).json({ 
        error: `Transaction is already ${transaction.status}. Only pending transactions can be processed.` 
      });
    }

    // Use MongoDB session for atomic operations
    const session = await User.startSession();
    
    try {
      await session.withTransaction(async () => {
        if (action === 'approve') {
          // Approve the transaction
          if (transaction.type === 'deposit') {
            // For deposits, add amount to user balance
            await User.findByIdAndUpdate(
              transaction.receiverId,
              { $inc: { balance: transaction.amount } },
              { session }
            );
          } else if (transaction.type === 'internal' || transaction.type === 'external') {
            // For transfers, deduct from sender and add to receiver (if internal)
            await User.findByIdAndUpdate(
              transaction.senderId,
              { $inc: { balance: -transaction.amount } },
              { session }
            );

            // If internal transfer, add to receiver
            if (transaction.type === 'internal' && transaction.receiverId) {
              await User.findByIdAndUpdate(
                transaction.receiverId,
                { $inc: { balance: transaction.amount } },
                { session }
              );
            }
          }

          // Update transaction status
          await Transaction.findByIdAndUpdate(
            transactionId,
            {
              status: 'completed',
              completedAt: new Date(),
              adminComment: adminComment || 'Approved by admin',
              processedBy: adminId,
              processedAt: new Date()
            },
            { session }
          );

        } else {
          // Reject the transaction
          await Transaction.findByIdAndUpdate(
            transactionId,
            {
              status: 'failed',
              adminComment: adminComment || 'Rejected by admin',
              processedBy: adminId,
              processedAt: new Date()
            },
            { session }
          );
        }
      });

      const updatedTransaction = await Transaction.findById(transactionId);

      res.status(200).json({
        success: true,
        message: `Transaction ${action}d successfully`,
        transaction: {
          id: updatedTransaction?._id,
          status: updatedTransaction?.status,
          adminComment: updatedTransaction?.adminComment,
          processedAt: updatedTransaction?.processedAt
        }
      });

    } catch (transactionError: any) {
      throw new Error(transactionError.message || 'Transaction processing failed');
    } finally {
      await session.endSession();
    }

  } catch (error: any) {
    console.error('Transaction approval error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process transaction'
    });
  }
}

export default authMiddleware('admin')(handler);