// src/v2/config/app.config.ts
// Firebase Functions v7: Config files use process.env directly
// Params module should only be used inside function handlers, not in files
// that are imported during module discovery phase

/**
 * Application configuration using environment variables
 * In v7, config files that are imported at module level should use process.env.
 * The params module is reserved for use inside function handlers only.
 */
export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || '2.0.0',

  cache: {
    type: (process.env.CACHE_TYPE || 'memory') as 'memory' | 'redis' | 'valkey',
    redisUrl: process.env.REDIS_URL,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',').filter(Boolean) || ['*'],
  },

  logging: {
    level: (process.env.LOG_LEVEL || 'info') as 'error' | 'warn' | 'info' | 'debug',
  },
};
