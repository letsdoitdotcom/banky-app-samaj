/**
 * Rate limiting middleware to prevent abuse of critical endpoints
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (in production, use Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: any) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Skip counting successful requests
}

// Default configurations for different endpoints
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints - prevent brute force
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5, // 5 attempts per 15 minutes
  },
  
  // Email sending - prevent spam
  email: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 2, // 2 emails per minute
  },
  
  // Financial transfers - prevent rapid transfers
  transfer: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // 10 transfers per minute
  },
  
  // Deposit operations - prevent rapid deposits
  deposit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 deposits per minute
  },
  
  // Registration - prevent spam accounts
  registration: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 3, // 3 registrations per hour per IP
  },
};

export function createRateLimit(config: RateLimitConfig) {
  return (req: any, res: any, next: () => void) => {
    const key = config.keyGenerator ? config.keyGenerator(req) : getDefaultKey(req);
    const now = Date.now();
    
    // Clean up expired entries
    cleanupExpiredEntries(now);
    
    const entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Create new entry or reset expired one
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      
      setRateLimitHeaders(res, config.maxRequests, config.maxRequests - 1, config.windowMs);
      return next();
    }
    
    if (entry.count >= config.maxRequests) {
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);
      
      setRateLimitHeaders(res, config.maxRequests, 0, remainingTime);
      
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${remainingTime} seconds.`,
        retryAfter: remainingTime,
      });
    }
    
    // Increment count
    entry.count++;
    rateLimitStore.set(key, entry);
    
    const remaining = Math.max(0, config.maxRequests - entry.count);
    const resetTime = Math.ceil((entry.resetTime - now) / 1000);
    
    setRateLimitHeaders(res, config.maxRequests, remaining, resetTime);
    
    next();
  };
}

function getDefaultKey(req: any): string {
  // Use IP address and user ID if available
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const userId = req.user?.userId || '';
  return `${ip}:${userId}`;
}

function setRateLimitHeaders(res: any, limit: number, remaining: number, resetTime: number) {
  res.setHeader('X-RateLimit-Limit', limit);
  res.setHeader('X-RateLimit-Remaining', remaining);
  res.setHeader('X-RateLimit-Reset', resetTime);
}

function cleanupExpiredEntries(now: number) {
  // Clean up expired entries to prevent memory leak
  const keysToDelete: string[] = [];
  rateLimitStore.forEach((entry, key) => {
    if (now > entry.resetTime) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

// Specific rate limiters for different use cases
export const authRateLimit = createRateLimit(RATE_LIMIT_CONFIGS.auth);
export const emailRateLimit = createRateLimit(RATE_LIMIT_CONFIGS.email);
export const transferRateLimit = createRateLimit(RATE_LIMIT_CONFIGS.transfer);
export const registrationRateLimit = createRateLimit(RATE_LIMIT_CONFIGS.registration);

// Custom rate limiter for transfer operations (per user)
export const transferPerUserRateLimit = createRateLimit({
  ...RATE_LIMIT_CONFIGS.transfer,
  keyGenerator: (req: any) => `transfer:${req.user?.userId || req.ip}`,
});

// Custom rate limiter for email operations (per email)
export const emailPerAddressRateLimit = createRateLimit({
  ...RATE_LIMIT_CONFIGS.email,
  keyGenerator: (req: any) => `email:${req.body?.email || req.ip}`,
});

// Custom rate limiter for deposit operations (per user)
export const depositRateLimit = createRateLimit({
  ...RATE_LIMIT_CONFIGS.deposit,
  keyGenerator: (req: any) => `deposit:${req.user?.userId || req.ip}`,
});