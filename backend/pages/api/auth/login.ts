import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { comparePassword, generateToken } from '../../../lib/auth';
import { authRateLimit } from '../../../middleware/rateLimit';
import Joi from 'joi';

// Validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Handle CORS
  const allowedOrigins = [
    'http://localhost:3000',
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

  // Apply rate limiting for login attempts
  return new Promise<void>((resolve, reject) => {
    authRateLimit(req, res, async () => {
      try {
        await handleLogin(req, res);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function handleLogin(req: NextApiRequest, res: NextApiResponse) {

  try {
    await connectDB();

    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map((d: any) => d.message) 
      });
    }

    const { email, password } = value;

    // Find user and include password for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await comparePassword(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.verified) {
      return res.status(403).json({ 
        error: 'Email not verified', 
        message: 'Please verify your email address before logging in. Check your inbox for the verification link.' 
      });
    }

    // Check if account is approved
    if (!user.approved) {
      return res.status(403).json({ 
        error: 'Account not approved', 
        message: 'Your account is pending admin approval. You will receive an email once your account is approved.' 
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id.toString(),
      email: user.email,
      role: 'user',
      accountNumber: user.accountNumber,
    });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        accountNumber: user.accountNumber,
        balance: user.balance,
        verified: user.verified,
        approved: user.approved,
        role: 'user',
      },
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}