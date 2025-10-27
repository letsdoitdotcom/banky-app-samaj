import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Email service interface
interface EmailService {
  sendVerificationEmail(to: string, token: string): Promise<boolean>;
  sendApprovalEmail(to: string, accountNumber: string): Promise<boolean>;
}

// Resend email service implementation
class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      await this.resend.emails.send({
        from: 'BankyApp <noreply@bankyapp.com>',
        to,
        subject: 'Verify Your Email Address - BankyApp',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Email Verification - BankyApp</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #1f2937; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f9fafb; }
                .button { display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏦 BankyApp</h1>
                </div>
                <div class="content">
                  <h2>Welcome to BankyApp!</h2>
                  <p>Thank you for registering with BankyApp. To complete your registration, please verify your email address by clicking the button below:</p>
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                  <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
                  <p style="word-break: break-all; color: #3b82f6;">${verificationUrl}</p>
                  <p><strong>Important:</strong> After email verification, your account will be reviewed by our admin team before approval.</p>
                  <p>This verification link will expire in 24 hours.</p>
                </div>
                <div class="footer">
                  <p>This is an automated message from BankyApp. Please do not reply to this email.</p>
                  <p>&copy; 2024 BankyApp. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  async sendApprovalEmail(to: string, accountNumber: string): Promise<boolean> {
    try {
      await this.resend.emails.send({
        from: 'BankyApp <noreply@bankyapp.com>',
        to,
        subject: '🎉 Your BankyApp Account Has Been Approved!',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Account Approved - BankyApp</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #059669; color: white; padding: 20px; text-align: center; }
                .content { padding: 30px 20px; background: #f0fdf4; }
                .account-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669; }
                .button { display: inline-block; padding: 12px 24px; background: #059669; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { padding: 20px; text-align: center; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏦 BankyApp</h1>
                  <h2>Account Approved!</h2>
                </div>
                <div class="content">
                  <h2>Congratulations! 🎉</h2>
                  <p>Your BankyApp account has been approved and is now active. You can now access all banking features.</p>
                  
                  <div class="account-info">
                    <h3>Your Account Details:</h3>
                    <p><strong>Account Number:</strong> ${accountNumber}</p>
                    <p><strong>Account Status:</strong> Active</p>
                    <p><strong>Initial Balance:</strong> $0.00</p>
                  </div>

                  <p>You can now:</p>
                  <ul>
                    <li>✅ Log in to your dashboard</li>
                    <li>✅ View your account details</li>
                    <li>✅ Make transfers (simulation)</li>
                    <li>✅ View transaction history</li>
                  </ul>

                  <a href="${process.env.FRONTEND_URL}/login" class="button">Access Your Account</a>

                  <p><strong>Keep your account number safe!</strong> You'll need it for transactions and identification.</p>
                </div>
                <div class="footer">
                  <p>Welcome to BankyApp! We're excited to have you on board.</p>
                  <p>&copy; 2024 BankyApp. All rights reserved.</p>
                </div>
              </div>
            </body>
          </html>
        `,
      });

      return true;
    } catch (error) {
      console.error('Failed to send approval email:', error);
      return false;
    }
  }
}

// Nodemailer email service implementation (fallback)
class NodemailerEmailService implements EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<boolean> {
    try {
      const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
      
      await this.transporter.sendMail({
        from: `"BankyApp" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verify Your Email Address - BankyApp',
        html: `
          <h2>Welcome to BankyApp!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>Or copy and paste this link: ${verificationUrl}</p>
          <p>This link expires in 24 hours.</p>
        `,
      });

      return true;
    } catch (error) {
      console.error('Failed to send verification email:', error);
      return false;
    }
  }

  async sendApprovalEmail(to: string, accountNumber: string): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: `"BankyApp" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Account Approved - BankyApp',
        html: `
          <h2>Congratulations! Your account has been approved.</h2>
          <p><strong>Account Number:</strong> ${accountNumber}</p>
          <p>You can now log in and start using BankyApp.</p>
          <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; padding: 10px 20px; background: #059669; color: white; text-decoration: none; border-radius: 5px;">Login Now</a>
        `,
      });

      return true;
    } catch (error) {
      console.error('Failed to send approval email:', error);
      return false;
    }
  }
}

// Export the email service based on configuration
export const emailService: EmailService = process.env.RESEND_API_KEY 
  ? new ResendEmailService() 
  : new NodemailerEmailService();