// src/v2/presentation/middlewares/requestLogger.ts

import { Request, Response, NextFunction } from 'express';
import { logger } from '../../shared/utils/logger';
import { formatServerTiming, RequestTimingContext, withRequestTiming } from '../../shared/utils/performanceTiming';
import { recordRequestMetric } from '../../shared/utils/runtimeMetrics';

/**
 * Logs request metadata and duration once the response finishes.
 */
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const requestLogger = logger.child('Request');
  const start = process.hrtime.bigint();
  const timingContext: RequestTimingContext = { phases: new Map() };
  let durationMs = 0;
  const originalEnd = res.end.bind(res);

  res.end = ((...args: Parameters<Response['end']>) => {
    durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    if (!res.headersSent) {
      res.setHeader('Server-Timing', formatServerTiming(timingContext, durationMs));
    }
    return originalEnd(...args);
  }) as Response['end'];

  // Log cuando termina la respuesta
  res.on('finish', () => {
    if (!durationMs) {
      durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
    }
    const responseBytes = Number(res.getHeader('content-length') || 0) || undefined;
    // Only a matched Express route gives a templated path (e.g.
    // "/catalog/:catalogId"); an unmatched request (404s, static assets)
    // falls back to req.path for logging but must never key the per-route
    // metrics map — that path is the raw, user-supplied URL and would give
    // metrics an unbounded, attacker-controlled cardinality.
    const matchedRoute = req.route?.path
      ? `${req.baseUrl || ''}${String(req.route.path)}`
      : undefined;
    const route = matchedRoute || req.path;
    const timings = Object.fromEntries(
      Array.from(timingContext.phases.entries()).map(([phase, duration]) => [phase, Number(duration.toFixed(1))])
    );

    recordRequestMetric({
      durationMs,
      statusCode: res.statusCode,
      responseBytes,
      route: matchedRoute ? `${req.method} ${matchedRoute}` : undefined,
      timings,
    });

    requestLogger.info('Request completed', {
      method: req.method,
      route,
      path: req.path,
      originalUrl: req.originalUrl,
      query: req.query,
      statusCode: res.statusCode,
      durationMs: Number(durationMs.toFixed(1)),
      responseBytes,
      cache: timingContext.cache,
      timings,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  withRequestTiming(timingContext, next);
};
