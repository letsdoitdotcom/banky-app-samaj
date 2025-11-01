import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
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

    console.log('🧪 Testing email delivery to:', email);
    const startTime = Date.now();
    
    // Import the enhanced email service
    const { enhancedEmailService } = await import('../../lib/enhancedEmailService');
    
    // Send a test verification email
    const result = await enhancedEmailService.sendVerificationEmail(
      email, 
      'Test User', 
      'test-token-' + Date.now()
    );
    
    const endTime = Date.now();
    const processingTime = endTime - startTime;

    if (result.success) {
      return res.status(200).json({
        success: true,
        message: `Test verification email sent successfully via ${result.service}`,
        details: {
          service: result.service,
          messageId: result.messageId,
          processingTime: `${processingTime}ms`,
          recipient: email,
          timestamp: new Date().toISOString()
        },
        recommendations: result.service === 'SMTP' ? [
          'SMTP delivery can take 5-15 minutes',
          'Check your spam/junk folder',
          'Consider upgrading to Resend for faster delivery'
        ] : [
          'Resend typically delivers within 1-2 minutes',
          'Check your spam/junk folder if not received',
          'Email should arrive shortly'
        ]
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send test email',
        error: result.error,
        processingTime: `${processingTime}ms`,
        troubleshooting: [
          'Check email service configuration in environment variables',
          'Verify SMTP credentials if using Gmail',
          'Ensure Resend API key is valid if configured',
          'Check server logs for more detailed error information'
        ]
      });
    }

  } catch (error) {
    console.error('❌ Email test failed:', error);
    return res.status(500).json({
      success: false,
      error: 'Email test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: [
        'Check if email service is properly configured',
        'Verify environment variables are set correctly',
        'Check network connectivity',
        'Review server logs for detailed error information'
      ]
    });
  }
}