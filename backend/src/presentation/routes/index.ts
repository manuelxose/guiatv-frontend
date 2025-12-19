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
import { AuthController } from '../controllers/AuthController';
import { createAuthRoutes } from './auth.routes';
import { DiscoveryController } from '../controllers/DiscoveryController';
import { createDiscoveryRoutes } from './discovery.routes';
import { ContentController } from '../controllers/ContentController';
import { createContentRoutes } from './content.routes';
import { TvController } from '../controllers/TvController';

import { createTvRoutes } from './tv.routes';
import { BlogController } from '../controllers/BlogController';
import { createBlogRoutes } from './blog.routes';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { createAnalyticsRoutes } from './analytics.routes';
import { AdminUsersController } from '../controllers/AdminUsersController';
import { createAdminUsersRoutes } from './admin-users.routes';

/**
 * Dependencies required by every route factory.
 */
export interface RoutesDependencies {
  channelController: ChannelController;
  programController: ProgramController;
  scheduleController: ScheduleController;
  layoutController: LayoutController;
  adminController: AdminController;
  adminUsersController: AdminUsersController;
  ssrController: SSRController;
  authController: AuthController;
  discoveryController: DiscoveryController;
  contentController: ContentController;

  tvController: TvController;
  blogController: BlogController;
  analyticsController: AnalyticsController;
}

/**
 * Registers all v2 routers and shared middlewares.
 */
export const createV2Routes = (dependencies: RoutesDependencies): Router => {
  const router = Router();

  // Documentación Swagger
  router.use('/docs', createSwaggerRoutes());

  // Health check (sin rate limit)
  router.use('/health', createHealthRoutes());

  // Aplicar rate limiting general
  router.use(generalRateLimit);

  // Rutas de recursos
  router.use(
    '/channels',
    createChannelRoutes(
      dependencies.channelController,
      dependencies.programController
    )
  );
  router.use('/programs', createProgramRoutes(dependencies.programController));
  router.use(
    '/schedules',
    createScheduleRoutes(dependencies.scheduleController)
  );
  router.use('/layouts', createLayoutRoutes(dependencies.layoutController));
  router.use(
    '/discovery',
    createDiscoveryRoutes(dependencies.discoveryController)
  );
  router.use('/content', createContentRoutes(dependencies.contentController));
  router.use('/tv', createTvRoutes(dependencies.tvController));

  router.use('/admin/users', createAdminUsersRoutes(dependencies.adminUsersController));
  router.use('/admin', createAdminRoutes(dependencies.adminController));
  router.use('/ssr', createSSRRoutes(dependencies.ssrController));
  router.use('/auth', createAuthRoutes(dependencies.authController));
  router.use('/blog', createBlogRoutes(dependencies.blogController));
  router.use('/analytics', createAnalyticsRoutes(dependencies.analyticsController));

  return router;
};
