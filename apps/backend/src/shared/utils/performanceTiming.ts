import { AsyncLocalStorage } from 'async_hooks';

export interface RequestTimingContext {
  phases: Map<string, number>;
  cache?: 'hit' | 'stale' | 'miss' | 'bypass';
}

const storage = new AsyncLocalStorage<RequestTimingContext>();

export function withRequestTiming(context: RequestTimingContext, next: () => void): void {
  storage.run(context, next);
}

export async function measureTiming<T>(phase: string, operation: () => Promise<T>): Promise<T> {
  const start = process.hrtime.bigint();
  try {
    return await operation();
  } finally {
    addTiming(phase, Number(process.hrtime.bigint() - start) / 1_000_000);
  }
}

export function addTiming(phase: string, durationMs: number): void {
  const context = storage.getStore();
  if (!context) return;
  context.phases.set(phase, (context.phases.get(phase) || 0) + durationMs);
}

export function setCacheTiming(result: RequestTimingContext['cache']): void {
  const context = storage.getStore();
  if (context) context.cache = result;
}

export function formatServerTiming(context: RequestTimingContext, totalMs: number): string {
  const entries = Array.from(context.phases.entries())
    .filter(([, duration]) => Number.isFinite(duration))
    .map(([phase, duration]) => `${sanitizeToken(phase)};dur=${duration.toFixed(1)}`);
  if (context.cache) entries.push(`cache-${context.cache};dur=0`);
  entries.push(`total;dur=${totalMs.toFixed(1)}`);
  return entries.join(', ');
}

function sanitizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
}
