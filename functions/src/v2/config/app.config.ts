// src/v2/config/app.config.ts

export const appConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiVersion: process.env.API_VERSION || '2.0.0',

  cache: {
    type: process.env.CACHE_TYPE || 'memory',
    redisUrl: process.env.REDIS_URL,
  },

  rateLimit: {
    windowMs: 60 * 1000, // 1 minuto
    max: 100,
  },

  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
