import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import Transaction from '../../../models/Transaction';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get all transactions with sender details
    const transactions = await Transaction.find()
      .populate('senderId', 'name email')
      .populate('completedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    // Get transaction statistics
    const stats = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] }
          },
          totalCompletedAmount: {
            $sum: { 
              $cond: [
                { $eq: ["$status", "completed"] }, 
                "$amount", 
                0
              ] 
            }
          }
        }
      }
    ]);

    const transactionStats = stats[0] || { 
      total: 0, 
      pending: 0, 
      completed: 0, 
      failed: 0, 
      totalCompletedAmount: 0 
    };

    res.status(200).json({
      transactions,
      stats: transactionStats,
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('admin')(handler);