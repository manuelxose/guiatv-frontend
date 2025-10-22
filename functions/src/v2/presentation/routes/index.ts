// src/v2/presentation/routes/index.ts

import { Router } from 'express';
import { ChannelController } from '../controllers/ChannelController';
import { ProgramController } from '../controllers/ProgramController';
import { ScheduleController } from '../controllers/ScheduleController';
import { createChannelRoutes } from './channel.routes';
import { createProgramRoutes } from './program.routes';
import { createScheduleRoutes } from './schedule.routes';
import { createHealthRoutes } from './health.routes';
import { generalRateLimit } from '../middlewares/rateLimit';
import { AdminController } from '../controllers/AdminController';
import { createAdminRoutes } from './admin.routes';
import { createSwaggerRoutes } from './swagger.routes';

export interface RoutesDependencies {
  channelController: ChannelController;
  programController: ProgramController;
  scheduleController: ScheduleController;
  adminController: AdminController;
}

export const createV2Routes = (dependencies: RoutesDependencies): Router => {
  const router = Router();

  // Documentación Swagger
  router.use('/docs', createSwaggerRoutes());

  // Health check (sin rate limit)
  router.use('/health', createHealthRoutes());

  // Aplicar rate limiting general
  router.use(generalRateLimit);

  // Rutas de recursos
  router.use('/channels', createChannelRoutes(dependencies.channelController));
  router.use('/programs', createProgramRoutes(dependencies.programController));
  router.use(
    '/schedules',
    createScheduleRoutes(dependencies.scheduleController)
  );

  router.use('/admin', createAdminRoutes(dependencies.adminController));

  return router;
};
