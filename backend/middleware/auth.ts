import { NextApiRequest, NextApiResponse } from 'next';
import { verifyToken, JWTPayload } from '../lib/auth';

export interface AuthenticatedRequest extends NextApiRequest {
  user?: JWTPayload;
}

export function authMiddleware(requiredRole?: 'user' | 'admin') {
  return (handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        // Handle CORS
        const allowedOrigins = [
          'http://localhost:3000',
          'https://incomparable-macaron-eb6786.netlify.app',
          process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        ];
        
        const origin = req.headers.origin;
        if (origin && allowedOrigins.includes(origin)) {
          res.setHeader('Access-Control-Allow-Origin', origin);
        }
        
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');

        // Handle CORS preflight
        if (req.method === 'OPTIONS') {
          return res.status(200).end();
        }

        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const payload = verifyToken(token);

        if (!payload) {
          return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Check role if required
        if (requiredRole && payload.role !== requiredRole) {
          return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Attach user to request
        (req as AuthenticatedRequest).user = payload;

        // Continue to the handler
        return handler(req as AuthenticatedRequest, res);
      } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
}

// CORS middleware
export function corsMiddleware(req: NextApiRequest, res: NextApiResponse, next: () => void) {
  const allowedOrigins = [
    'http://localhost:3000',
    'https://incomparable-macaron-eb6786.netlify.app',
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  ];
  
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  next();
}

// Validation middleware using Joi
export function validateRequest(schema: any) {
  return (handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) => {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      try {
        const { error } = schema.validate(req.body);
        if (error) {
          return res.status(400).json({ 
            error: 'Validation error', 
            details: error.details.map((d: any) => d.message) 
          });
        }

        return handler(req, res);
      } catch (error) {
        console.error('Validation middleware error:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    };
  };
}