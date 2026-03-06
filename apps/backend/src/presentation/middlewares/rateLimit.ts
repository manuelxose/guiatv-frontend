// src/v2/presentation/middlewares/rateLimit.ts

import rateLimit from 'express-rate-limit';
import { TooManyRequestsError } from '../../shared/errors';
import { Request, Response } from 'express';

/**
 * Creates a typed rate limiter that throws domain errors instead of generic responses.
 */
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
    handler: (req: Request, res: Response) => {
      void req;
      void res;
      throw new TooManyRequestsError(
        options?.message || 'Too many requests, please try again later'
      );
    },
  });
};

// Rate limiters
/**
 * Default limiter applied to most public routes.
 */
export const generalRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
});

/**
 * Stricter limiter for admin endpoints and heavy operations.
 */
export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many requests to this endpoint',
});

/**
 * Catalog and detail endpoints back most of the browsing experience and tolerate
 * a higher request volume than generic public routes.
 */
export const catalogRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Too many catalog requests, please retry in a few seconds',
});

export const discoveryRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
  message: 'Too many discovery requests, please retry in a few seconds',
});

export const contentRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
  message: 'Too many content detail requests, please retry in a few seconds',
});

export const interactionRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
  message: 'Too many interaction requests, please retry in a few seconds',
});
