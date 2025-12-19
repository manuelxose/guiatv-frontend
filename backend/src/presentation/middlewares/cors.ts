// src/v2/presentation/middlewares/cors.ts

import cors from 'cors';

/**
 * Parses allowed origins from environment variable.
 */
const parseAllowedOrigins = (): string[] | null => {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return null;
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins();

/**
 * CORS middleware that supports configurable origins and sensible local defaults.
 */
export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl) and same-origin
    if (!origin) return callback(null, true);
    if (!allowedOrigins) {
      // If no explicit origins configured, allow common localhost dev origins
      const devAllow = [
        'http://localhost:4200',
        'http://127.0.0.1:4200',
        'http://localhost:3000',
        'http://localhost:4000',
        'http://127.0.0.1:3000',
      ];
      if (devAllow.includes(origin)) return callback(null, true);
      // Fallback: lenient in local development
      return callback(null, true);
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Admin-Key'],
  credentials: !!process.env.ALLOW_CREDENTIALS || false,
  maxAge: 86400, // 24 horas
});
