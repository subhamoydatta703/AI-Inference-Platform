import { rateLimit } from 'express-rate-limit'
import { type AuthenticatedRequest } from '../auth/authMiddleware'

const createLimiter = (windowMs: number, limit: number) =>
  rateLimit({
    windowMs,
    limit,
    keyGenerator: (req: AuthenticatedRequest) => req.userId!,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      status: 429,
      message: "Too many requests. Please try again later.",
    },
  });

export const minuteLimiter = createLimiter(60_000, 10);
export const dailyLimiter = createLimiter(86_400_000, 100);