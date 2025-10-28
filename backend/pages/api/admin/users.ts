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

    // Get all users who have verified email but are not approved yet (eligible for approval)
    const pendingUsers = await User.find({ 
      emailVerified: true,
      approved: false 
    })
    .select('-password -verificationToken')
    .sort({ createdAt: 1 })
    .lean();

    // Get users who registered but haven't verified email yet
    const unverifiedUsers = await User.find({ 
      emailVerified: false
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
          emailUnverified: {
            $sum: { $cond: [{ $eq: ["$emailVerified", false] }, 1, 0] }
          },
          emailVerified: {
            $sum: { $cond: [{ $eq: ["$emailVerified", true] }, 1, 0] }
          },
          pending: {
            $sum: { 
              $cond: [{ 
                $and: [
                  { $eq: ["$emailVerified", true] },
                  { $eq: ["$approved", false] }
                ]
              }, 1, 0] 
            }
          },
          approved: {
            $sum: { $cond: [{ $eq: ["$approved", true] }, 1, 0] }
          }
        }
      }
    ]);

    const userStats = stats[0] || { total: 0, emailUnverified: 0, emailVerified: 0, pending: 0, approved: 0 };

    res.status(200).json({
      pendingUsers,
      unverifiedUsers,
      approvedUsers,
      stats: userStats,
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('admin')(handler);