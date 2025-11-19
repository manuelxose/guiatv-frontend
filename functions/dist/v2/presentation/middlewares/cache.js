"use strict";
// src/v2/presentation/middlewares/cache.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearCache = exports.cacheMiddleware = void 0;
const cache = new Map();
const cacheMiddleware = (ttlSeconds = 30) => {
    return (req, res, next) => {
        if (req.method !== 'GET')
            return next();
        const key = req.originalUrl || req.url;
        const entry = cache.get(key);
        const now = Date.now();
        if (entry && entry.expiresAt > now) {
            return res.json(entry.data);
        }
        // patch res.json to cache the response body
        const originalJson = res.json.bind(res);
        res.json = (body) => {
            try {
                cache.set(key, { expiresAt: now + ttlSeconds * 1000, data: body });
            }
            catch (e) {
                // ignore cache errors
            }
            return originalJson(body);
        };
        next();
    };
};
exports.cacheMiddleware = cacheMiddleware;
const clearCache = () => cache.clear();
exports.clearCache = clearCache;
//# sourceMappingURL=cache.js.map