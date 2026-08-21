import { randomUUID } from 'crypto';
import { ICacheRepository } from '../../domain/repositories/ICacheRepository';
import { measureTiming, setCacheTiming } from '../../shared/utils/performanceTiming';

export interface CacheFreshnessPolicy {
  freshSeconds: number;
  staleSeconds: number;
  jitterRatio?: number;
  lockSeconds?: number;
}

export interface CacheEnvelope<T> {
  value: T;
  freshUntil: number;
  staleUntil: number;
}

/**
 * Cache-aside read path with stale-while-revalidate and stampede protection.
 * The process-local promise map removes duplicate work inside one Node worker;
 * the optional repository lock coordinates refreshes across workers.
 */
export class StaleWhileRevalidateCache {
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly scheduled = new Set<string>();

  constructor(private readonly repository?: ICacheRepository) {}

  async clear(pattern: string): Promise<void> {
    try {
      await this.repository?.clear(pattern);
    } catch {
      // Invalidation is best-effort; versioned keys remain schema-safe.
    }
  }

  async getOrLoad<T>(
    key: string,
    policy: CacheFreshnessPolicy,
    loader: () => Promise<T>,
    shouldCache: (value: T) => boolean = () => true
  ): Promise<T> {
    const now = Date.now();
    const cached = await measureTiming('cache', () => this.read<T>(key));
    if (cached && cached.freshUntil > now) {
      setCacheTiming('hit');
      return cached.value;
    }

    if (cached && cached.staleUntil > now) {
      setCacheTiming('stale');
      // Let Express serialize/flush the stale response before beginning a
      // potentially CPU-heavy refresh in this process.
      if (!this.scheduled.has(key) && !this.inFlight.has(key)) {
        this.scheduled.add(key);
        setImmediate(() => {
          void this.refresh(key, policy, loader, shouldCache)
            .catch(() => undefined)
            .finally(() => this.scheduled.delete(key));
        });
      }
      return cached.value;
    }

    setCacheTiming(this.repository ? 'miss' : 'bypass');
    return this.refresh(key, policy, loader, shouldCache);
  }

  private async refresh<T>(
    key: string,
    policy: CacheFreshnessPolicy,
    loader: () => Promise<T>,
    shouldCache: (value: T) => boolean
  ): Promise<T> {
    const existing = this.inFlight.get(key) as Promise<T> | undefined;
    if (existing) return existing;

    const operation = this.loadWithLock(key, policy, loader, shouldCache)
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, operation);
    return operation;
  }

  private async loadWithLock<T>(
    key: string,
    policy: CacheFreshnessPolicy,
    loader: () => Promise<T>,
    shouldCache: (value: T) => boolean
  ): Promise<T> {
    const lockKey = `${key}:lock`;
    const lockValue = randomUUID();
    const supportsLock = Boolean(this.repository?.setIfAbsent);
    const acquired = !supportsLock || await this.repository!.setIfAbsent!(
      lockKey,
      lockValue,
      policy.lockSeconds ?? 15
    );

    if (!acquired) {
      for (let attempt = 0; attempt < 10; attempt += 1) {
        await delay(50);
        const filled = await this.read<T>(key);
        if (filled && filled.staleUntil > Date.now()) return filled.value;
      }
      // A failed/slow lock holder must not leave the public request hanging.
      return loader();
    }

    try {
      const value = await loader();
      if (shouldCache(value)) await this.write(key, value, policy);
      return value;
    } catch (error) {
      const stale = await this.read<T>(key);
      if (stale && stale.staleUntil > Date.now()) return stale.value;
      throw error;
    } finally {
      if (supportsLock && this.repository?.releaseLock) {
        await this.repository.releaseLock(lockKey, lockValue);
      }
    }
  }

  private async read<T>(key: string): Promise<CacheEnvelope<T> | null> {
    if (!this.repository) return null;
    try {
      return await this.repository.get<CacheEnvelope<T>>(key);
    } catch {
      return null;
    }
  }

  private async write<T>(
    key: string,
    value: T,
    policy: CacheFreshnessPolicy
  ): Promise<void> {
    if (!this.repository) return;
    const jitter = 1 + ((Math.random() * 2 - 1) * (policy.jitterRatio ?? 0.1));
    const freshMs = Math.max(1_000, policy.freshSeconds * 1_000 * jitter);
    const staleMs = Math.max(freshMs, policy.staleSeconds * 1_000 * jitter);
    const now = Date.now();
    const envelope: CacheEnvelope<T> = {
      value,
      freshUntil: now + freshMs,
      staleUntil: now + staleMs,
    };
    try {
      await this.repository.set(key, envelope, Math.ceil(staleMs / 1_000));
    } catch {
      // Cache failure must not fail a public read.
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
