import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import Admin from '../../../models/Admin';
import { comparePassword, hashPassword } from '../../../lib/auth';
import { authMiddleware, AuthenticatedRequest } from '../../../middleware/auth';
import Joi from 'joi';

// Validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.empty': 'Current password is required',
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string().min(6).required().messages({
    'string.min': 'New password must be at least 6 characters',
    'string.empty': 'New password is required',
    'any.required': 'New password is required'
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Password confirmation does not match new password',
    'any.required': 'Password confirmation is required'
  })
});

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await connectDB();

    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'admin') {
      return res.status(401).json({ error: 'Admin access required' });
    }

    // Validate request body
    const { error, value } = changePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: error.details[0]?.message || 'Invalid password data'
      });
    }

    const { currentPassword, newPassword } = value;

    // Find admin and include password for verification
    const admin = await Admin.findById(userId).select('+password');
    if (!admin) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const validPassword = await comparePassword(currentPassword, admin.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    admin.password = hashedNewPassword;
    admin.updatedAt = new Date();
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error: any) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to change password'
    });
  }
}

export default authMiddleware('admin')(handler);