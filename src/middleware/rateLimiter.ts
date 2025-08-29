// src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';

/**
 * Shared handler for rate-limit exceeded
 */
function rateLimitHandler(req: Request, res: Response, _next: NextFunction) {
  const limit = req.rateLimit?.limit ?? 0;
  const remaining = req.rateLimit?.remaining ?? 0;

  res.setHeader('X-RateLimit-Limit', limit.toString());
  res.setHeader('X-RateLimit-Remaining', remaining.toString());

  if (req.rateLimit?.resetTime) {
    const retryAfterSec = Math.ceil(
      (req.rateLimit.resetTime.getTime() - Date.now()) / 1000
    );
    res.setHeader('Retry-After', retryAfterSec.toString());
  }

  return res.status(429).json({
    success: false,
    message: 'Too many requests, please try again later.',
  });
}

/**
 * Factory to create a limiter
 */
export function createLimiter(windowMs: number, max: number) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
}

// Example limiters
export const globalLimiter = createLimiter(60 * 1000, 50);  // 50 req/min
export const shortenLimiter = createLimiter(60 * 1000, 10); // 10 req/min for /shorten
