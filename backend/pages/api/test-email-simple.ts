import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
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

    console.log('🧪 Simple email test for:', email);
    
    // Check if nodemailer is available
    try {
      const nodemailer = require('nodemailer');
      console.log('✅ Nodemailer loaded successfully');
      
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Test connection without sending
      await transporter.verify();
      
      return res.status(200).json({
        success: true,
        message: 'Email service configured correctly!',
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          hasUser: !!process.env.EMAIL_USER,
          hasPass: !!process.env.EMAIL_PASS
        }
      });
      
    } catch (emailError) {
      console.error('❌ Email service error:', emailError);
      return res.status(500).json({
        error: 'Email service configuration issue',
        details: emailError instanceof Error ? emailError.message : 'Unknown error',
        config: {
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          hasUser: !!process.env.EMAIL_USER,
          hasPass: !!process.env.EMAIL_PASS
        }
      });
    }

  } catch (error) {
    console.error('❌ Simple email test failed:', error);
    return res.status(500).json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}