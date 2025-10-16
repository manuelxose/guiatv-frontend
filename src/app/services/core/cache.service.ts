/**
 * Servicio de cache en memoria
 * Ubicación: src/app/services/core/cache.service.ts
 */

import { Injectable } from '@angular/core';
import { ICacheManager, ILogger } from '../../interfaces';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable({
  providedIn: 'root'
})
export class MemoryCacheService<T> implements ICacheManager<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  constructor(private logger: ILogger) {}

  get(key: string): T | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      this.logger.debug(`Cache miss for key: ${key}`);
      return null;
    }

    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired for key: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return cached.data;
  }

  set(key: string, data: T, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl;
    this.cache.set(key, { data, expiry });
    this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl}ms`);
  }

  has(key: string): boolean {
    const cached = this.cache.get(key);
    const isValid = cached ? Date.now() <= cached.expiry : false;
    return isValid;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      this.logger.debug(`Cache cleared for key: ${key}`);
    } else {
      this.cache.clear();
      this.logger.debug('All cache cleared');
    }
  }

  getSize(): number {
    return this.cache.size;
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}