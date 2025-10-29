import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import Transaction from '../../../models/Transaction';
import User from '../../../models/User';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get all transactions first without population to avoid errors
    let transactions;
    try {
      transactions = await Transaction.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .lean();
      
      console.log(`Found ${transactions.length} transactions`);
    } catch (findError: any) {
      console.error('Error finding transactions:', findError);
      throw new Error('Failed to retrieve transactions');
    }

    // Try to populate user data, but handle errors gracefully
    let populatedTransactions = transactions;
    try {
      populatedTransactions = await Transaction.populate(transactions, [
        {
          path: 'senderId',
          select: 'name email accountNumber',
          model: 'User'
        },
        {
          path: 'receiverId', 
          select: 'name email accountNumber',
          model: 'User'
        },
        {
          path: 'processedBy',
          select: 'name email',
          model: 'User'
        }
      ]);
    } catch (populateError: any) {
      console.error('Population error (using unpopulated data):', populateError);
      // Use unpopulated transactions if population fails
    }

    // Get transaction statistics
    let transactionStats;
    try {
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

      transactionStats = stats[0] || { 
        total: 0, 
        pending: 0, 
        completed: 0, 
        failed: 0, 
        totalCompletedAmount: 0 
      };
    } catch (statsError: any) {
      console.error('Stats aggregation error:', statsError);
      transactionStats = { 
        total: transactions.length, 
        pending: 0, 
        completed: 0, 
        failed: 0, 
        totalCompletedAmount: 0 
      };
    }

    res.status(200).json({
      transactions: populatedTransactions,
      stats: transactionStats,
    });

  } catch (error: any) {
    console.error('Get transactions error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export default authMiddleware('admin')(handler);