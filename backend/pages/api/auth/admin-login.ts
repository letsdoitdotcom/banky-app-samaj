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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    // Validate request body
    const { error, value } = adminLoginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Validation error', 
        details: error.details.map((d: any) => d.message) 
      });
    }

    const { email, password } = value;

    // Find admin and include password for verification
    const admin = await Admin.findOne({ email: email.toLowerCase() }).select('+password');

    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Check password
    const validPassword = await comparePassword(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

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