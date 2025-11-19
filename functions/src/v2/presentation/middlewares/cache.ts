// src/v2/presentation/middlewares/cache.ts

import { Request, Response, NextFunction } from 'express';

type CacheEntry = {
  expiresAt: number;
  data: any;
};

const cache = new Map<string, CacheEntry>();

export const cacheMiddleware = (ttlSeconds = 30) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl || req.url;
    const entry = cache.get(key);
    const now = Date.now();
    if (entry && entry.expiresAt > now) {
      return res.json(entry.data);
    }

    // patch res.json to cache the response body
    const originalJson = res.json.bind(res);
    res.json = (body: any) => {
      try {
        cache.set(key, { expiresAt: now + ttlSeconds * 1000, data: body });
      } catch (e) {
        // ignore cache errors
      }
      return originalJson(body);
    };

    next();
  };
};

export const clearCache = () => cache.clear();
