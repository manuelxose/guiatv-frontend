import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Configuración centralizada del servidor Express
 * Todas las variables de entorno se leen aquí
 */
export const config = {
  // ===== SERVIDOR =====
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV !== 'production',

  // ===== CORS =====
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // ===== FIREBASE =====
  // Project / Storage general settings (not Firebase-specific)
  project: {
    projectId: process.env.PROJECT_ID || 'guiatv',
    storageBucket: process.env.STORAGE_BUCKET || process.env.AWS_S3_BUCKET || 'guia-tv-storage',
  },

  // ===== VALKEY (Redis Compatible) =====
  valkey: {
    url: process.env.REDIS_URL,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },

  // ===== PATHS =====
  paths: {
    // Carpeta raíz del build SSR de Angular (contiene /browser e /server)
    distFolder:
      process.env.DIST_FOLDER ||
      path.resolve(__dirname, '../../dist/guiatv'),
  },

  // ===== OTRAS CONFIGURACIONES =====
  // Añade aquí otras variables de entorno que necesites
  externalApiKey: process.env.EXTERNAL_API_KEY,
};

/**
 * Validar configuración crítica
 */
export function validateConfig(): void {
  const errors: string[] = [];

  // We don't require Firebase specific env vars anymore; only warn if critical project info missing
  if (!config.project.projectId) {
    errors.push('PROJECT_ID no está configurado');
  }

  if (errors.length > 0) {
    console.error('❌ Errores de configuración:');
    errors.forEach(err => console.error(`  - ${err}`));
    throw new Error('Configuración inválida. Revisa las variables de entorno.');
  }

  console.log('✅ Configuración validada correctamente');
}
