import express, { Request, Response, NextFunction } from 'express';
import type { RoutesDependencies } from '../../v2/presentation/routes/app';

const router = express.Router();

/**
 * Router Express para la API v2 (clean architecture)
 * Usa el createApp existente de src/v2/presentation/routes/app.ts
 */

// Variable para cachear la app v2 una vez inicializada
let v2App: express.Application | null = null;

router.use(async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Si ya tenemos la app v2 cacheada, usarla directamente
    if (v2App) {
      return v2App(req, res, next);
    }

    // Lazy-load de la app v2 (solo la primera vez)
    const { createApp } = await import('../../v2/presentation/routes/app');
    const { createContainer } = await import('../../v2/config/container');

    // Crear container de dependencias
    const container = createContainer();
    
    // Inicializar container (si tiene método initialize)
    if (typeof (container as any).initialize === 'function') {
      await (container as any).initialize();
    }
    // Crear app v2 con las dependencias requeridas por las rutas
    const deps: RoutesDependencies = {
      channelController: container.get<any>('channelController'),
      programController: container.get<any>('programController'),
      scheduleController: container.get<any>('scheduleController'),
      adminController: container.get<any>('adminController'),
    };

    v2App = createApp(deps);

    // Procesar la request actual
    return v2App(req, res, next);
  } catch (error) {
    console.error('Error en router v2:', error);
    next(error);
  }
});

export default router;
