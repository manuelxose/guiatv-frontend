// src/v2/presentation/middlewares/errorHandler.ts

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../shared/errors';
import { logger } from '../../shared/utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errorLogger = logger.child('ErrorHandler');

  // Error operacional conocido (AppError)
  if (err instanceof AppError) {
    errorLogger.warn('Operational error', {
      name: err.name,
      message: err.message,
      code: err.code,
      statusCode: err.statusCode,
      path: req.path,
      method: req.method,
    });

    res.status(err.statusCode).json(err.toJSON());
    return;
  }

  // Error desconocido/inesperado
  errorLogger.error('Unexpected error', err, {
    path: req.path,
    method: req.method,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // No exponer detalles internos en producción
  const isDevelopment = process.env.NODE_ENV === 'development';

  res.status(500).json({
    error: {
      name: 'InternalServerError',
      message: isDevelopment ? err.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: err.stack }),
    },
  });
};
