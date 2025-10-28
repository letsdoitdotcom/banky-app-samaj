import { NextApiRequest, NextApiResponse } from 'next';
import { sendTestEmail } from '../../../lib/emailService';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  console.log('📋 Test email API called:', {
    method: req.method,
    hasUser: !!req.user,
    userRole: req.user?.role,
    userId: req.user?._id,
    body: req.body
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    console.log('🧪 Testing email configuration for:', email);
    console.log('📧 Email environment variables:', {
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      emailHost: process.env.EMAIL_HOST,
      emailPort: process.env.EMAIL_PORT
    });
    
    const result = await sendTestEmail(email);

    res.status(200).json({
      success: true,
      message: 'Test email sent successfully!',
      messageId: result.messageId
    });

  } catch (error) {
    console.error('❌ Email test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default authMiddleware('admin')(handler);