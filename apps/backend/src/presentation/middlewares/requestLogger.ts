// src/v2/presentation/middlewares/requestLogger.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/utils/logger';

/**
 * Logs request metadata and duration once the response finishes.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestLogger = logger.child('Request');
  const start = Date.now();

  // Log cuando termina la respuesta
  res.on('finish', () => {
    const duration = Date.now() - start;

    requestLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      originalUrl: req.originalUrl,
      query: req.query,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};
