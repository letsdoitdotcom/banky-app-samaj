import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { generateVerificationToken, generateVerificationTokenExpiry } from '../../../lib/auth';
import { sendPasswordResetEmail } from '../../../lib/emailService';
import Joi from 'joi';

// Validation schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  })
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS
  const allowedOrigins = [
    'http://localhost:3000',
    'https://incomparable-macaron-eb6786.netlify.app',
    'https://lumartrust.com',
    'https://www.lumartrust.com'
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
    await connectDB();

    // Validate request data
    const { error, value } = forgotPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { email } = value;

    // Find user by email (case insensitive)
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${email}$`, 'i') } 
    });

    // Always return success message for security (don't reveal if email exists)
    const successMessage = 'If an account with that email exists, we have sent a password reset link to it.';

    if (!user) {
      // Don't reveal that user doesn't exist
      return res.status(200).json({ message: successMessage });
    }

    // Check if user is approved and verified
    if (!user.approved || !user.verified) {
      // Don't reveal account status
      return res.status(200).json({ message: successMessage });
    }

    // Generate reset token
    const resetToken = generateVerificationToken();
    const resetTokenExpires = generateVerificationTokenExpiry();

    // Store reset token in user document
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetTokenExpires;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      console.log('✅ Password reset email sent to:', user.email);
    } catch (emailError) {
      console.error('❌ Failed to send password reset email:', emailError);
      
      // Clear the reset token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      
      return res.status(500).json({ error: 'Failed to send password reset email. Please try again.' });
    }

    res.status(200).json({ message: successMessage });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}