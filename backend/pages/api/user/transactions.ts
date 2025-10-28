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

    const userId = req.user?.userId;
    let userAccountNumber = req.user?.accountNumber;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized - missing user ID' });
    }

    // If account number is not in JWT, fetch it from the database
    if (!userAccountNumber) {
      const user = await User.findById(userId).select('accountNumber');
      if (!user || !user.accountNumber) {
        return res.status(404).json({ error: 'User account not found' });
      }
      userAccountNumber = user.accountNumber;
    }

    // Get ALL user's transactions (both sent and received)
    const transactions = await Transaction.find({
      $or: [
        { senderId: userId }, // Transactions sent by this user
        { receiverAccount: userAccountNumber } // Transactions received by this user
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      transactions,
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('user')(handler);