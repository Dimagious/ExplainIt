/**
 * US-021: Rate Limiting (Basic)
 * TASK-091: Install and configure express-rate-limit
 */

const rateLimit = require('express-rate-limit');

const NODE_ENV = process.env.NODE_ENV || 'development';

// TASK-095: Make limits configurable
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute
const MAX_REQUESTS = NODE_ENV === 'production' 
  ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_PROD) || 10
  : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_DEV) || 100;

/**
 * TASK-092: Configure rate limiter middleware
 * US-021: 10 requests/minute in production, 100 in development
 */
const rateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: MAX_REQUESTS,
  
  // TASK-093: Add rate limit headers
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // TASK-094: Custom error response
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      timestamp: new Date().toISOString()
    });
  },
  
  // Skip rate limiting for specific IPs (e.g., localhost during development)
  skip: (req) => {
    if (NODE_ENV === 'development' && req.ip === '::1') {
      return false; // Still apply rate limiting in dev (but with higher limit)
    }
    return false;
  },
  
  // Use IP address for rate limiting
  keyGenerator: (req) => {
    return req.ip || req.headers['x-forwarded-for'] || 'unknown';
  }
});

console.log(`⏱️  Rate limiting: ${MAX_REQUESTS} requests per ${RATE_LIMIT_WINDOW_MS/1000}s (${NODE_ENV})`);

module.exports = rateLimiter;
