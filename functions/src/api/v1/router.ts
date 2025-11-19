import express, { Request, Response, NextFunction } from 'express';

const router = express.Router();

/**
 * Router Express para la API v1 (legacy)
 * Delega al handler existente en src/v1/index.ts
 */
router.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Lazy-load del handler v1 existente
    const { api } = await import('../../v1/index');
    
    if (typeof api === 'function') {
      return api(req, res);
    }
    
    res.status(500).json({ error: 'v1 handler not available' });
  } catch (error) {
    console.error('Error en router v1:', error);
    next(error);
  }
});

export default router;
