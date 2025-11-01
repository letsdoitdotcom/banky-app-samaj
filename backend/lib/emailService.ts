const nodemailer = require('nodemailer');
import { sanitizeEmail, sanitizeName, sanitizeUrl, escapeHtml } from '../utils/sanitize';
type Transporter = any;

// Email transporter configuration
const createTransporter = (): Transporter => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    console.log('📧 Email transporter created successfully');
    return transporter;
  } catch (error) {
    console.error('❌ Failed to create email transporter:', error);
    throw new Error('Email service not available');
  }
};

// Enhanced email verification with Resend primary and SMTP fallback
export const sendVerificationEmail = async (
  email: string, 
  name: string, 
  verificationToken: string
) => {
  // Sanitize inputs to prevent injection attacks
  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedName = sanitizeName(name);
  const sanitizedToken = verificationToken.replace(/[^a-zA-Z0-9]/g, ''); // Only allow alphanumeric
  
  console.log(`📧 Attempting to send verification email to: ${sanitizedEmail}`);
  
  // Try Resend first if API key is available
  if (process.env.RESEND_API_KEY) {
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const baseUrl = sanitizeUrl(process.env.FRONTEND_URL || 'https://lumartrust.com');
      const verificationUrl = `${baseUrl}/verify-email?token=${sanitizedToken}`;
      
      const result = await resend.emails.send({
        from: 'LumaTrust <noreply@resend.dev>',
        to: sanitizedEmail,
        subject: '🏦 Verify Your LumaTrust Email Address',
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <title>Verify Your LumaTrust Email</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f7f9fc; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
              .header h1 { color: white; margin: 0; font-size: 28px; }
              .content { padding: 40px 30px; }
              .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
              .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; background-color: #f9fafb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🏦 Welcome to LumaTrust!</h1>
              </div>
              <div class="content">
                <h2>Hello ${escapeHtml(sanitizedName)}!</h2>
                <p>Thank you for registering with LumaTrust! Please verify your email address to complete your registration.</p>
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${verificationUrl}" class="button">✅ Verify Email Address</a>
                </div>
                <p>If the button doesn't work, copy this link: ${escapeHtml(verificationUrl)}</p>
                <p><strong>This link expires in 24 hours.</strong></p>
              </div>
              <div class="footer">
                <p>© 2024 LumaTrust - Digital Banking Solutions</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });
      
      console.log('✅ Email sent via Resend, ID:', result.data?.id);
      return { success: true, messageId: result.data?.id, service: 'Resend' };
      
    } catch (resendError) {
      console.error('❌ Resend failed, falling back to SMTP:', resendError);
      // Fall through to SMTP
    }
  }
  
  // Fallback to SMTP
  try {
    const transporter = createTransporter();
    const baseUrl = sanitizeUrl(process.env.FRONTEND_URL || 'https://lumartrust.com');
    const verificationUrl = `${baseUrl}/verify-email?token=${sanitizedToken}`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your LumaTrust Email</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f7f9fc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 40px 30px; }
        .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; text-align: center; }
        .step { display: flex; align-items: flex-start; margin: 16px 0; }
        .step-number { width: 32px; height: 32px; background: #667eea; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; margin-right: 16px; flex-shrink: 0; }
        .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; background-color: #f9fafb; }
        .warning { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .warning-text { color: #92400e; font-size: 14px; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏦 Welcome to LumaTrust!</h1>
        </div>
        
        <div class="content">
          <h2 style="color: #1f2937; margin-bottom: 16px;">Hello ${escapeHtml(sanitizedName)}!</h2>
          
          <p style="color: #4b5563; margin-bottom: 24px;">
            Thank you for registering with LumaTrust! To complete your registration and make your account 
            eligible for admin review, please verify your email address.
          </p>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${verificationUrl}" class="button">
              ✅ Verify Your Email Address
            </a>
          </div>
          
          <div style="margin: 32px 0;">
            <h3 style="color: #1f2937; margin-bottom: 16px;">What happens next?</h3>
            
            <div class="step">
              <div class="step-number">1</div>
              <div>
                <strong>Click the verification button above</strong><br>
                <span style="color: #6b7280;">Confirms your email address</span>
              </div>
            </div>
            
            <div class="step">
              <div class="step-number">2</div>
              <div>
                <strong>Your account becomes eligible for review</strong><br>
                <span style="color: #6b7280;">Admin team can now process your application</span>
              </div>
            </div>
            
            <div class="step">
              <div class="step-number">3</div>
              <div>
                <strong>Admin approves your account</strong><br>
                <span style="color: #6b7280;">You'll receive another email when approved</span>
              </div>
            </div>
            
            <div class="step">
              <div class="step-number">4</div>
              <div>
                <strong>Start banking with $1,000 welcome balance!</strong><br>
                <span style="color: #6b7280;">Full access to all banking features</span>
              </div>
            </div>
          </div>
          
          <div class="warning">
            <p class="warning-text">
              <strong>⏰ Important:</strong> This verification link expires in 24 hours. 
              Only verified accounts are eligible for admin approval.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <span style="word-break: break-all; color: #667eea;">${escapeHtml(verificationUrl)}</span>
          </p>
        </div>
        
        <div class="footer">
          <p>© 2024 LumaTrust - Professional Banking Simulation Platform</p>
          <p>This email was sent to ${escapeHtml(sanitizedEmail)}. If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"LumaTrust - Email Verification" <${process.env.EMAIL_USER}>`,
    to: sanitizedEmail,
    subject: '🏦 Verify Your LumaTrust Email Address',
    html: htmlContent,
  };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent via SMTP, ID:', info.messageId);
    return { success: true, messageId: info.messageId, service: 'SMTP' };
    
  } catch (smtpError) {
    console.error('❌ Both Resend and SMTP failed:', smtpError);
    const errorMessage = smtpError instanceof Error ? smtpError.message : 'Unknown error';
    return { success: false, error: `Email service failed: ${errorMessage}` };
  }
};

// Account approval notification template
export const sendApprovalEmail = async (
  email: string, 
  name: string, 
  accountNumber: string
) => {
  // Sanitize inputs to prevent injection attacks
  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedName = sanitizeName(name);
  const sanitizedAccountNumber = accountNumber.replace(/[^0-9]/g, '').substring(0, 10); // Only digits, max 10 chars
  
  const transporter = createTransporter();
  const baseUrl = sanitizeUrl(process.env.FRONTEND_URL || 'https://incomparable-macaron-eb6786.netlify.app');
  const loginUrl = `${baseUrl}/login`;
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your BankyApp Account is Ready!</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f7f9fc; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }
        .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
        .content { padding: 40px 30px; }
        .highlight { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 2px solid #10b981; }
        .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
        .account-details { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Account Approved!</h1>
        </div>
        
        <div class="content">
          <h2 style="color: #1f2937; margin-bottom: 16px;">Congratulations ${escapeHtml(sanitizedName)}!</h2>
          
          <p style="color: #4b5563; margin-bottom: 24px;">
            Great news! Your BankyApp account has been approved by our admin team. 
            You can now access all banking features with your welcome balance.
          </p>
          
          <div class="highlight">
            <h3 style="color: #065f46; margin: 0 0 16px 0;">🏦 Your Banking Details</h3>
            <div class="account-details">
              <p style="margin: 8px 0; font-size: 18px;"><strong>Account Number:</strong> ${accountNumber}</p>
              <p style="margin: 8px 0; font-size: 18px;"><strong>Welcome Balance:</strong> $1,000.00</p>
              <p style="margin: 8px 0; font-size: 16px; color: #059669;"><strong>Status:</strong> ✅ Active & Ready</p>
            </div>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="${loginUrl}" class="button">
              🚀 Login to Your Account
            </a>
          </div>
          
          <div style="margin: 32px 0;">
            <h3 style="color: #1f2937; margin-bottom: 16px;">What you can do now:</h3>
            <ul style="color: #4b5563; padding-left: 20px;">
              <li style="margin: 8px 0;">💸 <strong>Send Money:</strong> Transfer funds to other BankyApp users</li>
              <li style="margin: 8px 0;">📊 <strong>View Transactions:</strong> Track all your banking activity</li>
              <li style="margin: 8px 0;">👤 <strong>Manage Profile:</strong> Update your personal information</li>
              <li style="margin: 8px 0;">💳 <strong>Full Banking:</strong> Access all professional features</li>
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>🔐 Security Note:</strong> Please keep your account number and login credentials secure. 
              Never share them with anyone.
            </p>
          </div>
        </div>
        
        <div class="footer">
          <p>© 2024 BankyApp - Professional Banking Simulation Platform</p>
          <p>Welcome to the future of digital banking!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"BankyApp - Account Approved" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🎉 Your BankyApp Account is Ready! Welcome Aboard',
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Approval email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Failed to send approval email:', error);
    throw new Error('Failed to send approval email');
  }
};

// Test email function (for debugging)
export const sendTestEmail = async (email: string) => {
  const transporter = createTransporter();
  
  const mailOptions = {
    from: `"BankyApp Test" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🧪 BankyApp Email Test',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #667eea;">✅ Email Configuration Working!</h1>
        <p>If you received this email, your BankyApp email integration is properly configured.</p>
        <p><strong>Test sent at:</strong> ${new Date().toLocaleString()}</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Test email failed:', error);
    throw error;
  }
};