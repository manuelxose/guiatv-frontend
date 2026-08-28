// Shared bootstrap: sets TZ=Europe/Madrid and loads env vars.
// Must be the very first import.
import '../config/bootstrap';

import { createServer } from 'http';
import { createApp as createRoutesApp } from '../presentation/routes/app';
import { config, validateConfig } from './config';
import { createContainer } from '../config/container';
import { logger } from '../shared/utils/logger';
import { ChatSocketHub } from '../presentation/realtime/ChatSocketHub';

/**
 * Entry point for the standalone Express server.
 */
async function startServer() {
  try {
    logger.info('Starting Express server', { env: config.nodeEnv, port: config.port });

    validateConfig();

    const container = createContainer();
    await container.initialize();
    logger.info('Container initialized');

    const app = createRoutesApp({
      adminController: container.get('adminController'),
      adminUsersController: container.get('adminUsersController'),
      authController: container.get('authController'),
      authService: container.get('authService'),
      discoveryController: container.get('discoveryController'),
      contentController: container.get('contentController'),
      catalogController: container.get('catalogController'),
      tvController: container.get('tvController'),
      footballController: container.get('footballController'),
      blogController: container.get('blogController'),
      analyticsController: container.get('analyticsController'),
      monetizationController: container.get('monetizationController'),
      userController: container.get('userController'),
      interactionController: container.get('interactionController'),
      socialController: container.get('socialController'),
      chatController: container.get('chatController'),
      aiController: container.get('aiController'),
      aiAnalyticsController: container.get('aiAnalyticsController'),
      sitemapController: container.get('sitemapController'),
    });

    if (process.env.DISABLE_SCHEDULED_JOBS !== 'true') {
      const { initializeJobs } = await import('../jobs');
      initializeJobs({
        refreshFootballHome: () => container.get<any>('footballQueryService').getHome(),
      });
    }

    const httpServer = createServer(app);
    ChatSocketHub.getInstance().initialize(httpServer, container.get('authService'));

    const server = httpServer.listen(config.port, () => {
      logger.info(`Server listening on http://localhost:${config.port}`);
    });

    const shutdown = async (signal: string) => {
      logger.warn(`${signal} received, shutting down HTTP server`);

      server.close(async () => {
        logger.info('HTTP server closed');
        try {
          await container.cleanup();
        } catch (error) {
          logger.warn('Error while cleaning up container during shutdown', { error });
        }
        process.exit(0);
      });

      setTimeout(() => {
        logger.error('Forcefully exiting after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal error while starting server', { error });
    process.exit(1);
  }
}

startServer();
