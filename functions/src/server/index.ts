import { createApp } from './app';
import { config, validateConfig } from './config';

/**
 * Entry point del servidor Express
 */
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Express...');
    console.log(`📌 Entorno: ${config.nodeEnv}`);
    console.log(`📌 Puerto: ${config.port}`);

    // Validar configuración
    validateConfig();

    // Inicializar DI container (configura DB, cache y repositorios)
    console.log('🔥 Inicializando contenedor de dependencias...');
    const { createContainer } = await import('../v2/config/container');
    const container = createContainer();
    await container.initialize();
    console.log('✅ Contenedor inicializado');

    // Crear aplicación Express
    const app = createApp();

    // Inicializar jobs programados (se apoyan en contenedor inicializado)
    console.log('📅 Inicializando jobs programados...');
    const { initializeJobs } = await import('../jobs');
    initializeJobs();
    console.log('✅ Jobs programados inicializados');

    // Arrancar servidor HTTP
    const server = app.listen(config.port, () => {
      console.log('');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`✅ Servidor escuchando en http://localhost:${config.port}`);
      console.log('═══════════════════════════════════════════════════════');
      console.log('');
      console.log('Endpoints disponibles:');
      console.log(`  - Health Check: http://localhost:${config.port}/health`);
      console.log(`  - API v1:       http://localhost:${config.port}/v1/`);
      console.log(`  - API v2:       http://localhost:${config.port}/v2/`);
      console.log(`  - SSR:          http://localhost:${config.port}/`);
      console.log('');
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} recibido, cerrando servidor...`);
      
      server.close(() => {
        console.log('✅ Servidor HTTP cerrado');
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        console.error('❌ Forzando cierre del servidor (timeout)');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    console.error('❌ Error fatal al arrancar el servidor:', error);
    process.exit(1);
  }
}

// Arrancar servidor
startServer();
