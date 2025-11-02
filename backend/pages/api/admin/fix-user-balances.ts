import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<void> {
  // Handle CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'https://lumartrust.com',
    'https://www.lumartrust.com',
    'https://incomparable-macaron-eb6786.netlify.app'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    await connectDB();

    // Find all users with balance of 1000 and update to 50
    const usersToFix = await User.find({ balance: 1000 });
    
    console.log(`Found ${usersToFix.length} users with $1000 balance to fix`);
    
    let fixedCount = 0;
    for (const user of usersToFix) {
      user.balance = 50.00;
      await user.save();
      fixedCount++;
      console.log(`Fixed user ${user.email}: $1000 → $50`);
    }

    res.status(200).json({
      message: `Balance migration completed successfully`,
      usersFound: usersToFix.length,
      usersFixed: fixedCount,
      details: usersToFix.map(u => ({
        email: u.email,
        name: u.name,
        oldBalance: '$1,000.00',
        newBalance: '$50.00'
      }))
    });

  } catch (error) {
    console.error('Balance migration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default authMiddleware('admin')(handler);