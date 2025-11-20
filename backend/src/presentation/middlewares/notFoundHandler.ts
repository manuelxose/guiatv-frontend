// src/v2/presentation/middlewares/notFoundHandler.ts

import { Request, Response } from 'express';
import { NotFoundError } from '../../shared/errors';

export const notFoundHandler = (req: Request, res: Response): void => {
  throw new NotFoundError('Route', req.path);
};
