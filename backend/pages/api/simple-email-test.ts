import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    console.log('🧪 Testing simple email to:', email);
    
    // Test Resend directly
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        const result = await resend.emails.send({
          from: 'LumaTrust Test <noreply@resend.dev>',
          to: email,
          subject: '🧪 Simple Email Test - LumaTrust',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
              <h1>🎉 Email Test Successful!</h1>
              <p>This is a simple test email to verify Resend is working.</p>
              <p><strong>Sent to:</strong> ${email}</p>
              <p><strong>Time:</strong> ${new Date().toISOString()}</p>
              <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>If you received this email:</strong></p>
                <ul>
                  <li>✅ Resend API key is working</li>
                  <li>✅ Email delivery is functional</li>
                  <li>✅ Your LumaTrust verification emails should work</li>
                </ul>
              </div>
            </div>
          `,
        });
        
        console.log('✅ Simple test email sent, ID:', result.data?.id);
        
        return res.status(200).json({
          success: true,
          message: 'Test email sent successfully!',
          messageId: result.data?.id,
          recipient: email,
          service: 'Resend'
        });
        
      } catch (error) {
        console.error('❌ Resend test failed:', error);
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          service: 'Resend'
        });
      }
    } else {
      return res.status(500).json({
        success: false,
        error: 'Resend API key not configured'
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}