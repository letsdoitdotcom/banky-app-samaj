const nodemailer = require('nodemailer');
import { sanitizeEmail, sanitizeName, sanitizeUrl, escapeHtml } from '../utils/sanitize';

type Transporter = any;

// Enhanced email service with retry mechanisms
class EnhancedEmailService {
  private transporter: Transporter | null = null;
  private resend: any = null;

  constructor() {
    this.initializeServices();
  }

  private async initializeServices() {
    // Initialize Resend if available
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import('resend');
        this.resend = new Resend(process.env.RESEND_API_KEY);
        console.log('✅ Resend service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize Resend:', error);
      }
    }

    // Initialize SMTP if available
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        this.transporter = nodemailer.createTransporter({
          host: process.env.EMAIL_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.EMAIL_PORT || '587'),
          secure: false,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
          },
          pool: true, // Use connection pooling
          maxConnections: 5, // Limit concurrent connections
          rateDelta: 20000, // Rate limiting: 20 seconds
          rateLimit: 5, // Max 5 emails per rateDelta
        });
        console.log('✅ SMTP service initialized');
      } catch (error) {
        console.error('❌ Failed to initialize SMTP:', error);
      }
    }
  }

  // Retry mechanism for email sending
  private async retryOperation<T>(
    operation: () => Promise<T>, 
    maxRetries: number = 3, 
    delay: number = 1000
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.log(`❌ Email attempt ${attempt}/${maxRetries} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }

  // Send email using Resend service
  private async sendWithResend(to: string, subject: string, html: string) {
    if (!this.resend) {
      throw new Error('Resend service not available');
    }

    const result = await this.resend.emails.send({
      from: 'LumaTrust <noreply@resend.dev>',
      to,
      subject,
      html,
    });

    return { success: true, messageId: result.data?.id, service: 'Resend' };
  }

  // Send email using SMTP
  private async sendWithSMTP(to: string, subject: string, html: string) {
    if (!this.transporter) {
      throw new Error('SMTP service not available');
    }

    const result = await this.transporter.sendMail({
      from: `"LumaTrust" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    return { success: true, messageId: result.messageId, service: 'SMTP' };
  }

  // Enhanced verification email with fallback
  public async sendVerificationEmail(
    email: string, 
    name: string, 
    verificationToken: string
  ): Promise<{ success: boolean; messageId?: string; service?: string; error?: string }> {
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeName(name);
    const sanitizedToken = verificationToken.replace(/[^a-zA-Z0-9]/g, '');
    
    const baseUrl = sanitizeUrl(process.env.FRONTEND_URL || 'https://incomparable-macaron-eb6786.netlify.app');
    const verificationUrl = `${baseUrl}/verify-email?token=${sanitizedToken}`;
    
    const subject = '🏦 Verify Your LumaTrust Email Address';
    const html = `
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
          .footer { padding: 30px; text-align: center; color: #6b7280; font-size: 14px; background-color: #f9fafb; }
          .urgent { background-color: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .urgent-text { color: #92400e; font-weight: bold; margin: 0; }
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
              Thank you for registering with LumaTrust! Please verify your email address to complete your registration.
            </p>
            
            <div class="urgent">
              <p class="urgent-text">
                ⚡ Quick Action Required: Click the button below to verify your email within 24 hours
              </p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verificationUrl}" class="button">
                ✅ Verify Email Address Now
              </a>
            </div>
            
            <div style="margin: 24px 0; padding: 20px; background-color: #f0f9ff; border-radius: 8px;">
              <h3 style="color: #1f2937; margin-bottom: 16px;">📋 What Happens Next?</h3>
              <ol style="color: #4b5563; padding-left: 20px;">
                <li style="margin: 8px 0;"><strong>Email Verification</strong> - Click the button above</li>
                <li style="margin: 8px 0;"><strong>Admin Review</strong> - Your account becomes eligible for approval</li>
                <li style="margin: 8px 0;"><strong>Account Activation</strong> - You'll receive another email when approved</li>
                <li style="margin: 8px 0;"><strong>Start Banking</strong> - Login with $1,000 welcome balance!</li>
              </ol>
            </div>
            
            <div style="margin: 32px 0; padding: 16px; background-color: #fee2e2; border-radius: 8px; border-left: 4px solid #dc2626;">
              <p style="color: #dc2626; margin: 0; font-size: 14px;">
                <strong>🚨 Important:</strong> This verification link expires in 24 hours. If you don't verify your email, 
                your account will not be eligible for admin approval.
              </p>
            </div>
            
            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              If the button doesn't work, copy and paste this link:<br>
              <span style="word-break: break-all; color: #667eea;">${escapeHtml(verificationUrl)}</span>
            </p>
          </div>
          
          <div class="footer">
            <p>© 2024 LumaTrust - Digital Banking Solutions</p>
            <p>This email was sent to ${escapeHtml(sanitizedEmail)}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`📧 Attempting to send verification email to: ${sanitizedEmail}`);

    // Try Resend first (faster, more reliable)
    if (this.resend) {
      try {
        return await this.retryOperation(async () => {
          return await this.sendWithResend(sanitizedEmail, subject, html);
        });
      } catch (resendError) {
        console.error('❌ Resend failed, trying SMTP fallback:', resendError);
      }
    }

    // Fallback to SMTP
    if (this.transporter) {
      try {
        return await this.retryOperation(async () => {
          return await this.sendWithSMTP(sanitizedEmail, subject, html);
        });
      } catch (smtpError) {
        console.error('❌ SMTP also failed:', smtpError);
        const errorMessage = smtpError instanceof Error ? smtpError.message : 'Unknown error';
        return { 
          success: false, 
          error: `Both email services failed. Resend: ${this.resend ? 'failed' : 'not configured'}. SMTP: ${errorMessage}` 
        };
      }
    }

    return { 
      success: false, 
      error: 'No email services are properly configured' 
    };
  }

  // Enhanced approval email
  public async sendApprovalEmail(
    email: string, 
    name: string, 
    accountNumber: string
  ): Promise<{ success: boolean; messageId?: string; service?: string; error?: string }> {
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedName = sanitizeName(name);
    const sanitizedAccountNumber = accountNumber.replace(/[^0-9]/g, '').substring(0, 10);
    
    const baseUrl = sanitizeUrl(process.env.FRONTEND_URL || 'https://incomparable-macaron-eb6786.netlify.app');
    const loginUrl = `${baseUrl}/login`;
    
    const subject = '🎉 Your LumaTrust Account is Ready!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Account Approved - LumaTrust</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; margin: 0; padding: 0; background-color: #f7f9fc; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center; }
          .header h1 { color: white; margin: 0; font-size: 28px; font-weight: bold; }
          .content { padding: 40px 30px; }
          .highlight { background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 24px; border-radius: 12px; margin: 24px 0; text-align: center; border: 2px solid #10b981; }
          .button { display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white !important; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
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
            
            <div class="highlight">
              <h3 style="color: #065f46; margin: 0 0 16px 0;">🏦 Your Banking Details</h3>
              <p style="margin: 8px 0; font-size: 18px;"><strong>Account Number:</strong> ${sanitizedAccountNumber}</p>
              <p style="margin: 8px 0; font-size: 18px;"><strong>Welcome Balance:</strong> $1,000.00</p>
              <p style="margin: 8px 0; font-size: 16px; color: #059669;"><strong>Status:</strong> ✅ Active & Ready</p>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${loginUrl}" class="button">
                🚀 Login to Your Account
              </a>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2024 LumaTrust - Digital Banking Solutions</p>
            <p>Welcome to professional banking!</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`📧 Attempting to send approval email to: ${sanitizedEmail}`);

    // Try Resend first
    if (this.resend) {
      try {
        return await this.retryOperation(async () => {
          return await this.sendWithResend(sanitizedEmail, subject, html);
        });
      } catch (resendError) {
        console.error('❌ Resend failed, trying SMTP fallback:', resendError);
      }
    }

    // Fallback to SMTP
    if (this.transporter) {
      try {
        return await this.retryOperation(async () => {
          return await this.sendWithSMTP(sanitizedEmail, subject, html);
        });
      } catch (smtpError) {
        console.error('❌ SMTP also failed:', smtpError);
        const errorMessage = smtpError instanceof Error ? smtpError.message : 'Unknown error';
        return { 
          success: false, 
          error: `Both email services failed. SMTP: ${errorMessage}` 
        };
      }
    }

    return { 
      success: false, 
      error: 'No email services are properly configured' 
    };
  }
}

// Export singleton instance
const enhancedEmailService = new EnhancedEmailService();

export { enhancedEmailService };

// Legacy exports for backward compatibility
export const sendVerificationEmail = async (email: string, name: string, token: string) => {
  return enhancedEmailService.sendVerificationEmail(email, name, token);
};

export const sendApprovalEmail = async (email: string, name: string, accountNumber: string) => {
  return enhancedEmailService.sendApprovalEmail(email, name, accountNumber);
};