// src/v2/domain/repositories/ICacheRepository.ts

/**
 * Cache contract used to abstract redis/in-memory implementations.
 */
export interface ICacheRepository {
  /**
   * Retrieves a value by key, parsing it into the requested type.
   */
  get<T>(key: string): Promise<T | null>;
  /**
   * Stores a value in cache with an optional TTL in seconds.
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  /**
   * Removes a single cache entry.
   */
  delete(key: string): Promise<void>;
  /**
   * Clears cache entries, optionally using a pattern for partial eviction.
   */
  clear(pattern?: string): Promise<void>;
  // Optional lifecycle methods for caches that require an external connection
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  destroy?(): void;
  getConnectionStatus?(): boolean;
}
