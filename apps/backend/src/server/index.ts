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
      channelController: container.get('channelController'),
      programController: container.get('programController'),
      scheduleController: container.get('scheduleController'),
      layoutController: container.get('layoutController'),
      adminController: container.get('adminController'),
      adminUsersController: container.get('adminUsersController'),
      ssrController: container.get('ssrController'),
      authController: container.get('authController'),
      authService: container.get('authService'),
      discoveryController: container.get('discoveryController'),
      contentController: container.get('contentController'),
      tvController: container.get('tvController'),
      blogController: container.get('blogController'),
      analyticsController: container.get('analyticsController'),
      userController: container.get('userController'),
      socialController: container.get('socialController'),
      chatController: container.get('chatController'),
      sitemapController: container.get('sitemapController'),
    });

    const { initializeJobs } = await import('../jobs');
    initializeJobs();

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
