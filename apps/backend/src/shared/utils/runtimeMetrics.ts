import { monitorEventLoopDelay } from 'node:perf_hooks';

const MAX_SAMPLES = 2_000;
const requestDurations: number[] = [];
const mongoDurations: number[] = [];
const providerDurations: number[] = [];
const cacheDurations: number[] = [];
let requestCount = 0;
let serverErrors = 0;
let responseBytes = 0;
let cacheHits = 0;
let cacheMisses = 0;
let cacheErrors = 0;
let cacheConnected = false;
let cacheMemoryBytes = 0;
let cacheEvictions = 0;
const startedAt = Date.now();
const eventLoop = monitorEventLoopDelay({ resolution: 20 });
eventLoop.enable();

export function recordRequestMetric(input: {
  durationMs: number;
  statusCode: number;
  responseBytes?: number;
  timings?: Record<string, number>;
}): void {
  requestCount += 1;
  if (input.statusCode >= 500) serverErrors += 1;
  responseBytes += Math.max(input.responseBytes || 0, 0);
  push(requestDurations, input.durationMs);
  if (input.timings?.db != null) push(mongoDurations, input.timings.db);
  if (input.timings?.provider != null) push(providerDurations, input.timings.provider);
  if (input.timings?.cache != null) push(cacheDurations, input.timings.cache);
}

export function recordCacheLookup(hit: boolean, durationMs: number): void {
  if (hit) cacheHits += 1;
  else cacheMisses += 1;
  push(cacheDurations, durationMs);
}

export function recordCacheError(): void {
  cacheErrors += 1;
}

export function updateCacheRuntime(input: { connected: boolean; memoryBytes?: number; evictions?: number }): void {
  cacheConnected = input.connected;
  if (input.memoryBytes != null) cacheMemoryBytes = input.memoryBytes;
  if (input.evictions != null) cacheEvictions = input.evictions;
}

export function runtimeMetricsSnapshot(): Record<string, unknown> {
  const elapsedSeconds = Math.max((Date.now() - startedAt) / 1_000, 1);
  const memory = process.memoryUsage();
  const lookups = cacheHits + cacheMisses;
  return {
    requests: {
      total: requestCount,
      requestsPerSecond: round(requestCount / elapsedSeconds),
      serverErrors,
      errorRate: requestCount ? round(serverErrors / requestCount) : 0,
      responseBytes,
      latencyMs: summary(requestDurations),
    },
    mongo: { latencyMs: summary(mongoDurations) },
    provider: { latencyMs: summary(providerDurations) },
    cache: {
      connected: cacheConnected,
      hits: cacheHits,
      misses: cacheMisses,
      errors: cacheErrors,
      hitRate: lookups ? round(cacheHits / lookups) : 0,
      memoryBytes: cacheMemoryBytes,
      evictions: cacheEvictions,
      latencyMs: summary(cacheDurations),
    },
    process: {
      uptimeSeconds: Math.floor(process.uptime()),
      rssBytes: memory.rss,
      heapUsedBytes: memory.heapUsed,
      heapTotalBytes: memory.heapTotal,
      eventLoopLagMs: {
        mean: round(eventLoop.mean / 1e6),
        p95: round(eventLoop.percentile(95) / 1e6),
        max: round(eventLoop.max / 1e6),
      },
    },
  };
}

function push(target: number[], value: number): void {
  if (!Number.isFinite(value)) return;
  target.push(value);
  if (target.length > MAX_SAMPLES) target.shift();
}

function summary(values: number[]): Record<string, number> {
  if (!values.length) return { count: 0, p50: 0, p95: 0, p99: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: values.length,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
  };
}

function percentile(values: number[], fraction: number): number {
  return round(values[Math.min(values.length - 1, Math.ceil(values.length * fraction) - 1)]);
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
