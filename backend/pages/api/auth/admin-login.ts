import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import Admin from '../../../models/Admin';
import { comparePassword, generateToken } from '../../../lib/auth';
import Joi from 'joi';

// Validation schema
const adminLoginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
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

    // Log the request body for debugging
    console.log('Admin login request body:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', Object.keys(req.body || {}));

    // Validate request body
    const { error, value } = adminLoginSchema.validate(req.body);
    if (error) {
      console.log('Validation error details:', error.details);
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map((d: any) => d.message) 
      });
    }

    const { email, password } = value;
    
    console.log('Processing login for email:', email);
    console.log('Email after toLowerCase:', email.toLowerCase());
    console.log('Password length:', password.length);

    // Find admin and include password for verification
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');
    
    console.log('Admin found:', !!admin);
    if (admin) {
      console.log('Admin email in DB:', admin.email);
      console.log('Admin name:', admin.name);
      console.log('Admin password hash length:', admin.password.length);
    }

    if (!admin) {
      console.log('❌ No admin found with email:', email.toLowerCase());
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Check password
    console.log('Comparing passwords...');
    const validPassword = await comparePassword(password, admin.password);
    console.log('Password comparison result:', validPassword);
    
    if (!validPassword) {
      console.log('❌ Password comparison failed');
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }
    
    console.log('✅ Login successful for:', admin.email);

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    // Generate JWT token for admin
    const token = generateToken({
      userId: admin._id.toString(),
      email: admin.email,
      role: 'admin',
    });

    res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}