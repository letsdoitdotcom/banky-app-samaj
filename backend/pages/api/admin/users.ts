import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Get all pending users (not approved yet, regardless of verification)
    const pendingUsers = await User.find({ 
      approved: false 
    })
    .select('-password -verificationToken')
    .sort({ createdAt: 1 })
    .lean();

    // Get all approved users
    const approvedUsers = await User.find({ approved: true })
      .select('-password -verificationToken')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get user statistics
    const stats = await User.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unverified: {
            $sum: { $cond: [{ $eq: ["$verified", false] }, 1, 0] }
          },
          pending: {
            $sum: { 
              $cond: [{ $eq: ["$approved", false] }, 1, 0] 
            }
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$approved", true] }, 1, 0] }
          }
        }
      }
    ]);

    const userStats = stats[0] || { total: 0, unverified: 0, pending: 0, approved: 0 };

    res.status(200).json({
      pendingUsers,
      approvedUsers,
      stats: userStats,
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('admin')(handler);