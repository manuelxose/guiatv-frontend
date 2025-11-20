"use strict";
// src/v2/infrastructure/cache/CacheFactory.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheFactory = void 0;
const InMemoryCache_1 = require("./InMemoryCache");
const RedisCache_1 = require("./RedisCache");
class CacheFactory {
    static create(config) {
        if (config.type === 'redis') {
            if (!config.redisUrl) {
                // Fallback to in-memory cache if no URL provided
                // This makes Redis optional for local/emulator environments
                // and avoids throwing during DI initialization.
                // eslint-disable-next-line no-console
                console.warn('CacheFactory: redis requested but redisUrl not provided - using InMemoryCache fallback');
                return new InMemoryCache_1.InMemoryCache();
            }
            return new RedisCache_1.RedisCache(config.redisUrl, config.redisOptions);
        }
        return new InMemoryCache_1.InMemoryCache();
    }
}
exports.CacheFactory = CacheFactory;
//# sourceMappingURL=CacheFactory.js.map