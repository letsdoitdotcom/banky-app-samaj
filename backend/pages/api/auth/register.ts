import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '../../../lib/db';
import User from '../../../models/User';
import { hashPassword, generateVerificationToken, generateVerificationTokenExpiry, isValidEmail, isValidPassword, isValidPhone } from '../../../lib/auth';
import { seedDatabase } from '../../../lib/seed';
import Joi from 'joi';

// Validation schema for user registration
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.max': 'Name cannot exceed 100 characters',
    'any.required': 'Name is required'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'any.required': 'Password is required'
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required().messages({
    'string.pattern.base': 'Please provide a valid phone number',
    'any.required': 'Phone number is required'
  }),
  address: Joi.object({
    street: Joi.string().required().messages({ 'any.required': 'Street address is required' }),
    city: Joi.string().required().messages({ 'any.required': 'City is required' }),
    state: Joi.string().required().messages({ 'any.required': 'State is required' }),
    zipCode: Joi.string().required().messages({ 'any.required': 'ZIP code is required' }),
    country: Joi.string().required().messages({ 'any.required': 'Country is required' })
  }).required().messages({ 'any.required': 'Address is required' }),
  idNumber: Joi.string().required().messages({ 'any.required': 'ID number is required' })
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

  try {
    // Connect to database and seed if needed
    await connectDB();
    await seedDatabase();

    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map((detail) => detail.message)
      });
    }

    const { name, email, password, phone, address, idNumber } = value;

    // Additional validation
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const passwordValidation = isValidPassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    if (!isValidPhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { idNumber }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email is already registered' });
      }
      if (existingUser.idNumber === idNumber) {
        return res.status(400).json({ error: 'ID number is already registered' });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationTokenExpires = generateVerificationTokenExpiry();

    // Create new user
    const user = new User({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone.trim(),
      address: {
        street: address.street.trim(),
        city: address.city.trim(),
        state: address.state.trim(),
        zipCode: address.zipCode.trim(),
        country: address.country.trim()
      },
      idNumber: idNumber.trim(),
      verificationToken,
      verificationTokenExpires
    });

    await user.save();

    // Send verification email with enhanced service
    try {
      const { sendVerificationEmail } = await import('../../../lib/emailService');
      const emailResult = await sendVerificationEmail(user.email, user.name, verificationToken);
      
      if (emailResult.success) {
        console.log(`✅ Verification email sent successfully to:`, user.email, 'MessageID:', emailResult.messageId);
      } else {
        console.error('❌ Failed to send verification email:', emailResult.error || 'Unknown error');
        // Continue with registration even if email fails, but log the issue
      }
    } catch (emailError) {
      console.error('❌ Email service error during registration:', emailError);
      // Continue with registration even if email fails
    }

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        verified: user.verified,
        approved: user.approved
      }
    });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        error: `${field === 'email' ? 'Email' : 'ID number'} is already registered`
      });
    }

    res.status(500).json({ error: 'Internal server error' });
  }
}