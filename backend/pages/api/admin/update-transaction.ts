import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import Transaction from '../../../models/Transaction';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import Joi from 'joi';

// Validation schema
const updateTransactionSchema = Joi.object({
  transactionId: Joi.string().required(),
  status: Joi.string().valid('pending', 'completed', 'failed').required(),
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Validate request body
    const { error, value } = updateTransactionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail: any) => detail.message)
      });
    }

    const { transactionId, status } = value;

    // Find transaction
    const transaction = await Transaction.findById(transactionId);

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update transaction status
    transaction.status = status;
    if (status === 'completed') {
      transaction.completedAt = new Date();
      transaction.completedBy = req.user?.userId;
    }
    
    await transaction.save();

    // Populate the updated transaction for response
    await transaction.populate('senderId', 'name email');
    await transaction.populate('completedBy', 'name email');

    res.status(200).json({
      message: `Transaction ${status} successfully`,
      transaction,
    });

  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('admin')(handler);