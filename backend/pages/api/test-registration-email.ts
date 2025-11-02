import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('🔧 Testing email service for:', email);
    
    // Test environment variables
    console.log('📋 Environment check:');
    console.log('- RESEND_API_KEY exists:', !!process.env.RESEND_API_KEY);
    console.log('- RESEND_API_KEY length:', process.env.RESEND_API_KEY?.length);
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    
    // Test email service import and function
    try {
      const { sendVerificationEmail } = await import('../../lib/emailService');
      console.log('✅ Email service imported successfully');
      
      const testToken = 'test-verification-token-123';
      const result = await sendVerificationEmail(email, 'Test User', testToken);
      
      console.log('📧 Email result:', result);
      
      if (result.success) {
        return res.status(200).json({
          success: true,
          message: 'Test email sent successfully!',
          messageId: result.messageId,
          service: result.service
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'Email sending failed',
          details: result.error
        });
      }
      
    } catch (importError) {
      console.error('❌ Email service import failed:', importError);
      return res.status(500).json({
        success: false,
        error: 'Email service import failed',
        details: importError.message
      });
    }
    
  } catch (error: any) {
    console.error('❌ Test endpoint error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Test failed',
      details: error.message 
    });
  }
}