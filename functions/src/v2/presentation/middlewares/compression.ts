// src/v2/presentation/middlewares/compression.ts

import compression from 'compression';
import { Request, Response } from 'express';

export const compressionMiddleware = compression({
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance entre compresión y CPU
  threshold: 1024, // Solo comprimir respuestas > 1KB
});
