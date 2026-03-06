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
import { CatalogController } from '../controllers/CatalogController';
import { createCatalogRoutes } from './catalog.routes';
import { TvController } from '../controllers/TvController';

import { createTvRoutes } from './tv.routes';
import { BlogController } from '../controllers/BlogController';
import { createBlogRoutes } from './blog.routes';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { createAnalyticsRoutes } from './analytics.routes';
import { AdminUsersController } from '../controllers/AdminUsersController';
import { createAdminUsersRoutes } from './admin-users.routes';
import { UserController } from '../controllers/UserController';
import { SocialController } from '../controllers/SocialController';
import { ChatController } from '../controllers/ChatController';
import { SitemapController } from '../controllers/SitemapController';
import { createUserRoutes } from './user.routes';
import { createSocialRoutes } from './social.routes';
import { createChatRoutes } from './chat.routes';
import { AuthService } from '../../domain/services/AuthService';
import { InteractionController } from '../controllers/InteractionController';
import { AIController } from '../controllers/AIController';
import { createInteractionRoutes } from './interaction.routes';
import { createAIRoutes } from './ai.routes';

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
  authService: AuthService;
  discoveryController: DiscoveryController;
  contentController: ContentController;
  catalogController: CatalogController;

  tvController: TvController;
  blogController: BlogController;
  analyticsController: AnalyticsController;
  userController: UserController;
  interactionController: InteractionController;
  socialController: SocialController;
  chatController: ChatController;
  aiController: AIController;
  sitemapController: SitemapController;
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
    createDiscoveryRoutes(dependencies.discoveryController, dependencies.authService)
  );
  router.use(
    '/content',
    createContentRoutes(dependencies.contentController, dependencies.authService)
  );
  router.use(
    '/catalog',
    createCatalogRoutes(dependencies.catalogController, dependencies.authService)
  );
  router.use('/tv', createTvRoutes(dependencies.tvController));
  router.use(
    '/user/interactions',
    createInteractionRoutes(dependencies.interactionController, dependencies.authService)
  );
  router.use('/user', createUserRoutes(dependencies.userController, dependencies.authService));
  router.use('/social', createSocialRoutes(dependencies.socialController, dependencies.authService));
  router.use('/chat', createChatRoutes(dependencies.chatController, dependencies.authService));
  router.use('/ai', createAIRoutes(dependencies.aiController, dependencies.authService));

  router.use(
    '/admin/users',
    createAdminUsersRoutes(dependencies.adminUsersController, dependencies.authService)
  );
  router.use('/admin', createAdminRoutes(dependencies.adminController, dependencies.authService));
  router.use('/ssr', createSSRRoutes(dependencies.ssrController));
  router.use('/auth', createAuthRoutes(dependencies.authController));
  router.use('/blog', createBlogRoutes(dependencies.blogController));
  router.use('/analytics', createAnalyticsRoutes(dependencies.analyticsController, dependencies.authService));

  return router;
};
