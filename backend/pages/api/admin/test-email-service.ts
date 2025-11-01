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
    const { email, testType = 'verification' } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    console.log(`🧪 Testing ${testType} email to:`, email);
    
    // Test both email services
    const results: any = {
      timestamp: new Date().toISOString(),
      testEmail: email,
      testType,
      services: {}
    };

    // Test Resend Service
    try {
      if (process.env.RESEND_API_KEY) {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const testResult = await resend.emails.send({
          from: 'LumaTrust Test <noreply@resend.dev>',
          to: email,
          subject: '🧪 LumaTrust Email Service Test - Resend',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #667eea;">✅ Resend Email Service Working!</h1>
              <p>If you received this email, the Resend email service is properly configured and working.</p>
              <p><strong>Test Type:</strong> ${testType}</p>
              <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Service:</strong> Resend API</p>
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #0369a1; margin: 0;"><strong>Next Steps:</strong></p>
                <ul style="color: #0369a1;">
                  <li>Check your spam folder if you don't see verification emails</li>
                  <li>Add our email to your contacts</li>
                  <li>Resend service should deliver emails within 1-2 minutes</li>
                </ul>
              </div>
            </div>
          `,
        });
        
        results.services.resend = {
          status: 'success',
          messageId: testResult.data?.id,
          service: 'Resend API',
          expectedDelivery: '1-2 minutes'
        };
        
        console.log('✅ Resend test email sent:', testResult.data?.id);
      } else {
        results.services.resend = {
          status: 'not_configured',
          message: 'RESEND_API_KEY not found'
        };
      }
    } catch (resendError) {
      console.error('❌ Resend test failed:', resendError);
      results.services.resend = {
        status: 'error',
        error: resendError instanceof Error ? resendError.message : 'Unknown error'
      };
    }

    // Test Nodemailer Service
    try {
      if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        const nodemailer = require('nodemailer');
        
        const transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
        });

        // Verify connection
        await transporter.verify();
        
        const testResult = await transporter.sendMail({
          from: `"LumaTrust Test" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: '🧪 LumaTrust Email Service Test - SMTP',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #10b981;">✅ SMTP Email Service Working!</h1>
              <p>If you received this email, the SMTP email service is properly configured and working.</p>
              <p><strong>Test Type:</strong> ${testType}</p>
              <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Service:</strong> SMTP (${process.env.EMAIL_HOST})</p>
              <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="color: #166534; margin: 0;"><strong>Delivery Notes:</strong></p>
                <ul style="color: #166534;">
                  <li>SMTP delivery can take 5-15 minutes</li>
                  <li>May be slower during high traffic periods</li>
                  <li>Check spam folder - SMTP emails are more likely to be filtered</li>
                </ul>
              </div>
            </div>
          `,
        });
        
        results.services.smtp = {
          status: 'success',
          messageId: testResult.messageId,
          service: 'SMTP',
          host: process.env.EMAIL_HOST,
          expectedDelivery: '5-15 minutes'
        };
        
        console.log('✅ SMTP test email sent:', testResult.messageId);
      } else {
        results.services.smtp = {
          status: 'not_configured',
          message: 'EMAIL_USER and/or EMAIL_PASS not found'
        };
      }
    } catch (smtpError) {
      console.error('❌ SMTP test failed:', smtpError);
      results.services.smtp = {
        status: 'error',
        error: smtpError instanceof Error ? smtpError.message : 'Unknown error'
      };
    }

    // Determine overall status
    const hasWorkingService = Object.values(results.services).some(
      (service: any) => service.status === 'success'
    );

    return res.status(200).json({
      success: hasWorkingService,
      message: hasWorkingService 
        ? 'At least one email service is working' 
        : 'No email services are properly configured',
      results,
      recommendations: [
        'If using Gmail SMTP, ensure 2-factor authentication is enabled and use an app password',
        'Check spam/junk folders for emails',
        'Consider using Resend for faster, more reliable delivery',
        'Verify your email credentials are correct in environment variables'
      ]
    });

  } catch (error) {
    console.error('❌ Email service test failed:', error);
    return res.status(500).json({
      error: 'Email service test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}