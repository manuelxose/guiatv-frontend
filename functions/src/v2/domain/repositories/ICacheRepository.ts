// src/v2/domain/repositories/ICacheRepository.ts

export interface ICacheRepository {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(pattern?: string): Promise<void>;
  // Optional lifecycle methods for caches that require an external connection
  connect?(): Promise<void>;
  disconnect?(): Promise<void>;
  destroy?(): void;
  getConnectionStatus?(): boolean;
}
