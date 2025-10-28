import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import { generateUniqueAccountNumber } from '../../../lib/seed';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already approved
    if (user.approved) {
      return res.status(400).json({ error: 'User is already approved' });
    }

    // Generate unique account number
    const accountNumber = await generateUniqueAccountNumber();

    // Approve user, verify, and assign account number
    user.approved = true;
    user.verified = true; // Auto-verify when admin approves
    user.accountNumber = accountNumber;
    user.balance = 1000; // Initial welcome balance
    await user.save();

    // TODO: Send approval email
    // const emailSent = await emailService.sendApprovalEmail(user.email, accountNumber);

    res.status(200).json({
      message: 'User approved successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        approved: user.approved,
        balance: user.balance,
      },
    });

  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('admin')(handler);