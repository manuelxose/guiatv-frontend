import { RequestHandler } from 'express';

/**
 * Wraps async route handlers and forwards rejected promises to Express error handling.
 */
export const asyncHandler =
  (fn: RequestHandler): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next as any);
  };
