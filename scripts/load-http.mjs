import { performance } from 'node:perf_hooks';

const base = (process.env.PERF_API_BASE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const timeoutMs = Number(process.env.PERF_TIMEOUT_MS || 30_000);
const levels = String(process.env.PERF_LOAD_LEVELS || '10,50,100')
  .split(',').map(Number).filter((value) => value > 0);
const routes = String(process.env.PERF_LOAD_ROUTES || [
  '/v2/tv/read?view=now&limit=36&includeChannels=false',
  '/v2/tv/read?view=day&limit=240&includeChannels=false',
  '/v2/sports/football/home',
  '/v2/sports/football/news?limit=12',
  '/v2/blog?limit=20',
].join('|')).split('|').filter(Boolean);

for (const route of routes) {
  for (const concurrency of levels) {
    const samples = await Promise.all(Array.from({ length: concurrency }, (_, index) => request(
      `${base}${route}`,
      // Exercise the application limiter as independent clients, not one abusive IP.
      `198.18.${Math.floor(index / 250)}.${(index % 250) + 1}`
    )));
    const successful = samples.filter((sample) => sample.status >= 200 && sample.status < 400);
    const durations = successful.map((sample) => sample.durationMs).sort((a, b) => a - b);
    console.log(JSON.stringify({
      route,
      concurrency,
      successful: successful.length,
      failed: samples.length - successful.length,
      p50Ms: percentile(durations, 0.5),
      p95Ms: percentile(durations, 0.95),
      p99Ms: percentile(durations, 0.99),
      maxMs: durations.at(-1) ?? null,
    }));
    if (successful.length !== samples.length) process.exitCode = 1;
  }
}

async function request(url, forwardedFor) {
  const started = performance.now();
  try {
    const response = await fetch(url, {
      headers: { 'accept-encoding': 'gzip, br', 'x-forwarded-for': forwardedFor },
      signal: AbortSignal.timeout(timeoutMs),
    });
    await response.arrayBuffer();
    return { status: response.status, durationMs: round(performance.now() - started) };
  } catch (error) {
    return { status: 0, durationMs: round(performance.now() - started), error: String(error) };
  }
}

function percentile(values, fraction) {
  if (!values.length) return null;
  return values[Math.min(values.length - 1, Math.ceil(values.length * fraction) - 1)];
}

function round(value) {
  return Math.round(value * 10) / 10;
}
