// src/v2/presentation/middlewares/notFoundHandler.ts

import { Request, Response } from 'express';
import { NotFoundError } from '../../shared/errors';

/**
 * Fallback middleware that surfaces a typed 404 error for unmatched routes.
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  void res;
  throw new NotFoundError('Route', req.path);
};
