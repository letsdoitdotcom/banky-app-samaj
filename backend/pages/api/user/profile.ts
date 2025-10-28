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

    const userId = req.user?.userId;
    
    console.log('Profile API - JWT payload:', req.user);
    console.log('Profile API - User ID:', userId);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user profile (exclude password and verification token)
    console.log('Profile API - Looking up user with ID:', userId);
    const user = await User.findById(userId).select('-password -verificationToken');

    console.log('Profile API - User lookup result:', user ? 'Found' : 'Not found');
    
    if (!user) {
      console.log('Profile API - User not found for ID:', userId);
      return res.status(404).json({ error: 'User not found' });
    }

    // Debug logging
    console.log('Profile API - User found:', {
      id: user._id,
      email: user.email,
      balance: user.balance,
      balanceType: typeof user.balance,
      verified: user.verified,
      approved: user.approved,
      accountNumber: user.accountNumber
    });

    res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        idNumber: user.idNumber,
        accountNumber: user.accountNumber,
        balance: user.balance,
        verified: user.verified,
        approved: user.approved,
        createdAt: user.createdAt,
      },
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('user')(handler);