import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    console.log('🧪 Testing verified domain email delivery to:', email);
    console.log('📋 Environment check:');
    console.log('   - RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('   - FRONTEND_URL:', process.env.FRONTEND_URL);

    // Import and test email service
    const { sendVerificationEmail } = await import('../../lib/emailService');
    
    const testToken = 'test_' + Math.random().toString(36).substring(2, 15);
    const emailResult = await sendVerificationEmail(email, 'Test User', testToken);
    
    console.log('📧 Email test result:', emailResult);
    
    if (emailResult.success) {
      res.status(200).json({
        success: true,
        message: `Test verification email sent successfully to ${email}`,
        details: {
          messageId: emailResult.messageId,
          service: emailResult.service,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to send test email',
        details: emailResult.error
      });
    }

  } catch (error: any) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Test failed', 
      details: error.message || 'Unknown error'
    });
  }
}