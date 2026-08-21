import { performance } from 'node:perf_hooks';
import http from 'node:http';
import https from 'node:https';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';

const mode = process.argv[2] || 'critical';
const apiBase = (process.env.PERF_API_BASE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const frontendBase = (process.env.PERF_FRONTEND_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const repetitions = Math.max(3, Number(process.env.PERF_REPETITIONS || 15));
const concurrency = Math.max(1, Number(process.env.PERF_CONCURRENCY || 1));
const timeoutMs = Math.max(1_000, Number(process.env.PERF_TIMEOUT_MS || 60_000));
let requestSequence = 0;

const apiRoutes = [
  '/v2/tv/read?view=now&limit=36&includeChannels=false',
  '/v2/tv/read?view=day&limit=240&includeChannels=false',
  '/v2/tv/read?view=next&limit=48&includeChannels=false',
  '/v2/tv/read?view=night&limit=48&includeChannels=false',
  '/v2/sports/football/home',
  '/v2/sports/football/matches?date=today',
  '/v2/sports/football/matches/live',
  '/v2/sports/football/competitions',
  '/v2/sports/football/news?limit=12',
  '/v2/blog?limit=20',
  '/v2/blog/categories',
];
const frontendRoutes = [
  '/',
  '/programacion-tv/guia-canales',
  '/deportes',
  '/editorial',
  '/deportes/futbol/noticias',
];

const discovered = await discoverDetailRoutes(apiBase);
if (mode !== 'frontend') {
  apiRoutes.push(...discovered.apiPaths);
}
if (mode !== 'api') {
  frontendRoutes.push(...discovered.frontendPaths);
}

const targets = mode === 'api'
  ? apiRoutes.map((path) => [apiBase, path])
  : mode === 'frontend'
    ? frontendRoutes.map((path) => [frontendBase, path])
    : [
        ...apiRoutes.map((path) => [apiBase, path]),
        ...frontendRoutes.map((path) => [frontendBase, path]),
      ];

for (const [base, path] of targets) {
  const cold = await request(`${base}${path}`);
  const samples = [];
  for (let offset = 0; offset < repetitions; offset += concurrency) {
    samples.push(...await Promise.all(
      Array.from({ length: Math.min(concurrency, repetitions - offset) }, () => request(`${base}${path}`))
    ));
  }
  const successful = samples.filter((sample) => sample.status >= 200 && sample.status < 400);
  const durations = successful.map((sample) => sample.durationMs).sort((a, b) => a - b);
  const bytes = successful.map((sample) => sample.bytes);
  const wireBytes = successful.map((sample) => sample.wireBytes).filter(Number.isFinite);
  console.log(JSON.stringify({
    route: `${base}${path}`,
    cold,
    warm: {
      samples: samples.length,
      successful: successful.length,
      p50Ms: percentile(durations, 0.50),
      p95Ms: percentile(durations, 0.95),
      p99Ms: percentile(durations, 0.99),
      minBytes: bytes.length ? Math.min(...bytes) : null,
      maxBytes: bytes.length ? Math.max(...bytes) : null,
      minWireBytes: wireBytes.length ? Math.min(...wireBytes) : null,
      maxWireBytes: wireBytes.length ? Math.max(...wireBytes) : null,
    },
  }));
  if (!successful.length) process.exitCode = 1;
}

async function request(url) {
  const started = performance.now();
  try {
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const result = await new Promise((resolve, reject) => {
      const sequence = requestSequence++;
      const req = client.get(parsed, {
        headers: {
          'accept-encoding': 'gzip, br',
          'x-forwarded-for': `198.19.${Math.floor(sequence / 250)}.${(sequence % 250) + 1}`,
        },
      }, (response) => {
        const chunks = [];
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve({ response, body: Buffer.concat(chunks) }));
      });
      req.setTimeout(timeoutMs, () => req.destroy(new Error(`timeout after ${timeoutMs}ms`)));
      req.on('error', reject);
    });
    const { response, body } = result;
    const contentEncoding = response.headers['content-encoding'] || null;
    let decoded = body;
    try {
      if (contentEncoding === 'br') decoded = brotliDecompressSync(body);
      else if (contentEncoding === 'gzip') decoded = gunzipSync(body);
    } catch {
      decoded = body;
    }
    return {
      status: response.statusCode || 0,
      durationMs: round(performance.now() - started),
      bytes: decoded.byteLength,
      wireBytes: body.byteLength,
      contentEncoding,
      cacheControl: response.headers['cache-control'] || null,
      serverTiming: response.headers['server-timing'] || null,
    };
  } catch (error) {
    return { status: 0, durationMs: round(performance.now() - started), bytes: 0, error: String(error) };
  }
}

function percentile(values, fraction) {
  if (!values.length) return null;
  return round(values[Math.min(values.length - 1, Math.ceil(values.length * fraction) - 1)]);
}

function round(value) {
  return Math.round(value * 10) / 10;
}

async function discoverDetailRoutes(base) {
  const apiPaths = [];
  const frontendPaths = [];
  try {
    const [homeResponse, competitionsResponse, blogResponse, newsResponse] = await Promise.all([
      fetch(`${base}/v2/sports/football/home`, { headers: { 'x-forwarded-for': '198.19.250.1' } }),
      fetch(`${base}/v2/sports/football/competitions`, { headers: { 'x-forwarded-for': '198.19.250.2' } }),
      fetch(`${base}/v2/blog?limit=1`, { headers: { 'x-forwarded-for': '198.19.250.3' } }),
      fetch(`${base}/v2/sports/football/news?limit=1`, { headers: { 'x-forwarded-for': '198.19.250.4' } }),
    ]);
    const home = (await homeResponse.json())?.data || {};
    const competitions = (await competitionsResponse.json())?.data?.competitions || [];
    const postsPayload = await blogResponse.json();
    const posts = Array.isArray(postsPayload) ? postsPayload : postsPayload?.data?.posts || [];
    const newsPayload = await newsResponse.json();
    const newsItems = newsPayload?.data?.news || [];

    const match = [...(home.liveMatches || []), ...(home.todayMatches || []), ...(home.upcomingMatches || [])][0];
    const matchSlug = match?.slug || match?.id;
    const teamSlug = match?.homeTeam?.slug;
    const competitionSlug = competitions[0]?.slug;
    const newsSlug = newsItems[0]?.slug;

    if (matchSlug) {
      apiPaths.push(`/v2/sports/football/matches/${encodeURIComponent(matchSlug)}`);
      frontendPaths.push(`/deportes/futbol/partido/${encodeURIComponent(matchSlug)}`);
    }
    if (teamSlug) {
      apiPaths.push(`/v2/sports/football/teams/${encodeURIComponent(teamSlug)}`);
      frontendPaths.push(`/deportes/futbol/equipos/${encodeURIComponent(teamSlug)}`);
    }
    if (competitionSlug) {
      apiPaths.push(`/v2/sports/football/competitions/${encodeURIComponent(competitionSlug)}`);
      frontendPaths.push(`/deportes/futbol/competiciones/${encodeURIComponent(competitionSlug)}`);
    }
    if (posts[0]?.slug) apiPaths.push(`/v2/blog?slug=${encodeURIComponent(posts[0].slug)}`);
    if (newsSlug) {
      apiPaths.push(`/v2/sports/football/news?slug=${encodeURIComponent(newsSlug)}`);
      frontendPaths.push(`/deportes/futbol/noticias/${encodeURIComponent(newsSlug)}`);
    }
  } catch {
    // Core benchmark routes remain useful when optional discovery data is unavailable.
  }
  return { apiPaths, frontendPaths };
}
