import { Injectable } from '@angular/core';

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

/**
 * Lightweight in-memory cache with TTL to avoid duplicate HTTP calls.
 * This replaces the legacy scattered caches with a single reusable helper.
 */
@Injectable({ providedIn: 'root' })
export class ApiCacheService {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  clear(key?: string): void {
    if (key) {
      this.store.delete(key);
    } else {
      this.store.clear();
    }
  }
}
