import { NextApiRequest, NextApiResponse } from 'next';
// Simple test endpoint without CORS dependencies

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple CORS headers
  res.setHeader('Access-Control-Allow-Origin', 'https://incomparable-macaron-eb6786.netlify.app');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🧪 Simple test API called:', {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  console.log('🧪 Test Simple API - Method:', req.method);

  if (req.method === 'POST' || req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Simple test API working!',
      method: req.method,
      timestamp: new Date().toISOString(),
      environment: {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPass: !!process.env.EMAIL_PASS,
        emailHost: process.env.EMAIL_HOST,
        emailPort: process.env.EMAIL_PORT,
        frontendUrl: process.env.FRONTEND_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
  }

  console.log('❌ Method not allowed:', req.method);
  return res.status(405).json({ 
    error: 'Method not allowed',
    method: req.method,
    allowedMethods: ['GET', 'POST']
  });
}