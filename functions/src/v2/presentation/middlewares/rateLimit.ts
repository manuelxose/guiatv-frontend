// src/v2/presentation/middlewares/rateLimit.ts

import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '../../shared/errors';

export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || 60 * 1000, // 1 minuto
    max: options?.max || 100, // 100 requests por ventana
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      throw new TooManyRequestsError(
        options?.message || 'Too many requests, please try again later'
      );
    },
  });
};

// Rate limiters específicos
export const generalRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
});

export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many requests to this endpoint',
});
