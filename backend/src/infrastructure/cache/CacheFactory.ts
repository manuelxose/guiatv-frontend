// src/v2/infrastructure/cache/CacheFactory.ts

import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { InMemoryCache } from './InMemoryCache';
import { RedisCache } from './RedisCache';

/**
 * Factory to instantiate the configured cache backend.
 */
export class CacheFactory {
  /**
   * Creates a cache repository based on configuration, with safe fallbacks.
   */
  static create(config: {
    type: 'memory' | 'redis';
    redisUrl?: string;
    redisOptions?: {
      maxRetries?: number;
      retryDelay?: number;
      connectTimeout?: number;
    };
  }): ICacheRepository {
    if (config.type === 'redis') {
      if (!config.redisUrl) {
        // Fallback to in-memory cache if no URL provided
        // This makes Redis optional for local/emulator environments
        // and avoids throwing during DI initialization.
        // eslint-disable-next-line no-console
        console.warn('CacheFactory: redis requested but redisUrl not provided - using InMemoryCache fallback');
        return new InMemoryCache();
      }
      return new RedisCache(config.redisUrl, config.redisOptions);
    }

    return new InMemoryCache();
  }
}
