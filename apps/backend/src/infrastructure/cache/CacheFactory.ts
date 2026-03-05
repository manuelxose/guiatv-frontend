// src/v2/infrastructure/cache/CacheFactory.ts

import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { InMemoryCache } from './InMemoryCache';
import { ValkeyCache } from './ValkeyCache';

/**
 * Factory to instantiate the configured cache backend.
 */
export class CacheFactory {
  /**
   * Creates a cache repository based on configuration, with safe fallbacks.
   */
  static create(config: {
    type: 'memory' | 'redis' | 'valkey';
    redisUrl?: string;
    redisOptions?: {
      maxRetries?: number;
      retryDelay?: number;
      connectTimeout?: number;
    };
  }): ICacheRepository {
    if (config.type === 'redis' || config.type === 'valkey') {
      if (!config.redisUrl) {
        // Fallback to in-memory cache if no URL provided
        // This makes Redis/Valkey optional for local/emulator environments
        // and avoids throwing during DI initialization.
        // eslint-disable-next-line no-console
        console.warn(`CacheFactory: ${config.type} requested but redisUrl not provided - using InMemoryCache fallback`);
        return new InMemoryCache();
      }
      // ValkeyCache handles both redis and valkey connections via redis driver
      return new ValkeyCache(config.redisUrl, config.redisOptions);
    }

    return new InMemoryCache();
  }
}
