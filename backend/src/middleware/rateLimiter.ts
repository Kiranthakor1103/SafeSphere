import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [ip: string]: { count: number; resetTime: number };
}

const authStore: RateLimitStore = {};
const sosStore: RateLimitStore = {};

export const authRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown_ip';
  const now = Date.now();
  const maxRequests = 15;
  const windowMs = 15 * 60 * 1000; // 15 mins

  if (!authStore[ip] || now > authStore[ip].resetTime) {
    authStore[ip] = { count: 1, resetTime: now + windowMs };
    return next();
  }

  authStore[ip].count += 1;

  if (authStore[ip].count > maxRequests) {
    const retryAfterMins = Math.ceil((authStore[ip].resetTime - now) / 60000);
    res.status(429).json({
      success: false,
      message: `Too many login attempts from this IP. Please try again in ${retryAfterMins} minutes.`,
    });
    return;
  }

  next();
};

export const sosRateLimiter = (req: Request, res: Response, next: NextFunction): void => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown_ip';
  const now = Date.now();
  const maxRequests = 20;
  const windowMs = 5 * 60 * 1000; // 5 mins

  if (!sosStore[ip] || now > sosStore[ip].resetTime) {
    sosStore[ip] = { count: 1, resetTime: now + windowMs };
    return next();
  }

  sosStore[ip].count += 1;

  if (sosStore[ip].count > maxRequests) {
    res.status(429).json({
      success: false,
      message: 'Too many SOS requests submitted. Please wait a moment before sending another request.',
    });
    return;
  }

  next();
};
