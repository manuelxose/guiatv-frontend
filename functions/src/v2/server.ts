// src/v2/server.ts (para testing local)

import { createApp } from './presentation/routes/app';
import { Container } from './config/container';
import { logger } from './shared/utils/logger';
import { appConfig } from './config/app.config';

async function startServer() {
  try {
    logger.info('Starting local server...');

    // Inicializar container
    const container = Container.getInstance();
    await container.initialize();

    // Crear app
    const app = createApp({
      channelController: container.get('channelController'),
      programController: container.get('programController'),
      scheduleController: container.get('scheduleController'),
      adminController: container.get('adminController'),
    });

    // Iniciar servidor
    const port = appConfig.port;
    const server = app.listen(port, () => {
      logger.info(`Server running on port ${port}`, {
        version: appConfig.apiVersion,
        env: appConfig.env,
      });
      logger.info(`Health check: http://localhost:${port}/v2/health`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');

      server.close(async () => {
        await container.cleanup();
        logger.info('Server closed');
        process.exit(0);
      });

      // Force close after 10s
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

// Solo ejecutar si es el archivo principal
if (require.main === module) {
  startServer();
}
