// src/v2/presentation/middlewares/rateLimit.ts

import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { TooManyRequestsError } from '../../shared/errors';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from './authGuard';

const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * A read made by a process on this host, i.e. Angular SSR calling http://127.0.0.1:4000 directly.
 *
 * SSR sends no visitor address, so without this every server render on the site shared the single "127.0.0.1"
 * bucket of the per-IP limiters, and a crawl burst rate-limited the renderer itself (Phase 2D-0).
 *
 * Trust assumptions (verified 2026-10-20): every public request reaches the API through nginx, and every nginx
 * location that proxies to the API sets X-Forwarded-For and X-Real-IP (`$proxy_add_x_forwarded_for`, never empty);
 * ports 3000/4000 are closed to the outside by ufw. The check uses the TCP peer address, which a remote client cannot
 * forge, and requires the forwarding headers to be absent, which a client cannot achieve through nginx. A forwarded
 * header never grants the exemption. Only GET/HEAD are exempt, so writes (login, telemetry, admin) stay limited.
 * It skips rate limiting only, never authentication; per-endpoint quotas opt out with `exemptLocalReads: false`.
 *
 * ponytail: any process on this host is exempt, including the other sites' services (separate Unix users). Their
 * unlimited reads are an availability risk only; the upgrade path is a secret header that only guiatv-ssr holds
 * (root-only /etc/guiatv/ssr.env + api.env).
 */
export function isDirectLocalRead(req: Request): boolean {
  return (
    (req.method === 'GET' || req.method === 'HEAD') &&
    LOOPBACK_ADDRESSES.has(req.socket?.remoteAddress ?? '') &&
    req.headers['x-forwarded-for'] === undefined &&
    req.headers['x-real-ip'] === undefined &&
    req.headers['forwarded'] === undefined
  );
}

/**
 * Creates a typed rate limiter that throws domain errors instead of generic responses.
 */
export const createRateLimiter = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  /** false for a per-endpoint quota (e.g. data export) that must hold for local callers too. */
  exemptLocalReads?: boolean;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || 60 * 1000, // 1 minuto
    max: options?.max || 100, // 100 requests por ventana
    standardHeaders: true,
    legacyHeaders: false,
    skip: options?.exemptLocalReads === false ? undefined : isDirectLocalRead,
    handler: (req: Request, res: Response) => {
      void req;
      void res;
      throw new TooManyRequestsError(
        options?.message || 'Too many requests, please try again later'
      );
    },
  });
};

// Rate limiters
/**
 * Default limiter applied to most public routes.
 */
export const generalRateLimit = createRateLimiter({
  windowMs: 60 * 1000, // 1 minuto
  max: 100,
});

/**
 * Stricter limiter for admin endpoints and heavy operations.
 */
export const strictRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Too many requests to this endpoint',
});

/**
 * Catalog and detail endpoints back most of the browsing experience and tolerate
 * a higher request volume than generic public routes.
 */
export const catalogRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  message: 'Too many catalog requests, please retry in a few seconds',
});

export const discoveryRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
  message: 'Too many discovery requests, please retry in a few seconds',
});

export const contentRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
  message: 'Too many content detail requests, please retry in a few seconds',
});

export const interactionRateLimit = createRateLimiter({
  windowMs: 60 * 1000,
  max: 600,
  message: 'Too many interaction requests, please retry in a few seconds',
});

/**
 * AI chat endpoints – 10 mensajes por minuto por usuario autenticado.
 */
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) =>
    (req as AuthenticatedRequest).user?.id ??
    ipKeyGenerator(req.ip ?? req.socket.remoteAddress ?? 'unknown'),
  handler: (req: Request, res: Response) => {
    void req;
    void res;
    throw new TooManyRequestsError('Too many AI requests, please wait before trying again');
  },
});
