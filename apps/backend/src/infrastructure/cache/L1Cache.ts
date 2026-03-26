/**
 * L1Cache — in-process synchronous Map cache with bounded size (FIFO eviction).
 * Designed for hot-path data that is safe to serve slightly stale (e.g. now-playing, schedules).
 * Does NOT implement ICacheRepository intentionally — stays sync and dependency-free.
 */
export class L1Cache<T = unknown> {
  private readonly store = new Map<string, { value: T; expiresAt: number }>();

  constructor(private readonly maxSize: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T, ttlMs: number): void {
    if (this.store.size >= this.maxSize) {
      // FIFO eviction: drop oldest entry
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Invalidate all keys matching a prefix. */
  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }

  get size(): number {
    return this.store.size;
  }
}

// Singleton — shared across the process for hot-path caching.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const l1Cache = new L1Cache<any>(200);
