// src/v2/infrastructure/cache/CacheFactory.ts

import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { InMemoryCache } from './InMemoryCache';
import { RedisCache } from './RedisCache';

export class CacheFactory {
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
        throw new Error('Redis URL is required for Redis cache');
      }
      return new RedisCache(config.redisUrl, config.redisOptions);
    }

    return new InMemoryCache();
  }
}
