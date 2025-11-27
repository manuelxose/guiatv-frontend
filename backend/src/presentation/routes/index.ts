// src/v2/presentation/routes/index.ts

import { Router } from 'express';
import { ChannelController } from '../controllers/ChannelController';
import { ProgramController } from '../controllers/ProgramController';
import { ScheduleController } from '../controllers/ScheduleController';
import { LayoutController } from '../controllers/LayoutController';
import { createChannelRoutes } from './channel.routes';
import { createProgramRoutes } from './program.routes';
import { createScheduleRoutes } from './schedule.routes';
import { createLayoutRoutes } from './layout.routes';
import { createHealthRoutes } from './health.routes';
import { generalRateLimit } from '../middlewares/rateLimit';
import { AdminController } from '../controllers/AdminController';
import { createAdminRoutes } from './admin.routes';
import { createSwaggerRoutes } from './swagger.routes';
import { SSRController } from '../controllers/SSRController';
import { createSSRRoutes } from './ssr.routes';

export interface RoutesDependencies {
  channelController: ChannelController;
  programController: ProgramController;
  scheduleController: ScheduleController;
  layoutController: LayoutController;
  adminController: AdminController;
  ssrController: SSRController;
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
  router.use('/channels', createChannelRoutes(dependencies.channelController, dependencies.programController));
  router.use('/programs', createProgramRoutes(dependencies.programController));
  router.use(
    '/schedules',
    createScheduleRoutes(dependencies.scheduleController)
  );
  router.use(
    '/layouts',
    createLayoutRoutes(dependencies.layoutController)
  );

  router.use('/admin', createAdminRoutes(dependencies.adminController));
  router.use('/ssr', createSSRRoutes(dependencies.ssrController));

  return router;
};
