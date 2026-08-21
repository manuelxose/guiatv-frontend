const apiBase = (process.env.PREWARM_API_BASE_URL || 'http://127.0.0.1:4000').replace(/\/$/, '');
const frontendBase = (process.env.PREWARM_FRONTEND_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');

const urls = [
  `${apiBase}/v2/tv/read?view=now&limit=36&includeChannels=false`,
  `${apiBase}/v2/tv/read?view=now&date=today&limit=8&includeChannels=false`,
  `${apiBase}/v2/tv/read?view=night&limit=48&includeChannels=false`,
  `${apiBase}/v2/tv/read?view=night&date=today&limit=12&includeChannels=false`,
  `${apiBase}/v2/tv/read?view=day&limit=240&includeChannels=false`,
  `${apiBase}/v2/discovery/home`,
  `${apiBase}/v2/sports/football/home`,
  `${apiBase}/v2/sports/football/matches?date=today`,
  `${apiBase}/v2/sports/football/competitions`,
  `${apiBase}/v2/sports/football/news?limit=12`,
  `${apiBase}/v2/blog?limit=20`,
  `${apiBase}/v2/blog/categories`,
  `${frontendBase}/`,
  `${frontendBase}/programacion-tv/guia-canales`,
  `${frontendBase}/deportes`,
  `${frontendBase}/editorial`,
  `${frontendBase}/deportes/futbol/noticias`,
];

let failed = false;
for (const url of urls) {
  const started = performance.now();
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
    await response.arrayBuffer();
    const result = { url, status: response.status, durationMs: Math.round(performance.now() - started) };
    console.log(JSON.stringify(result));
    if (!response.ok) failed = true;
  } catch (error) {
    failed = true;
    console.error(JSON.stringify({ url, status: 0, error: String(error) }));
  }
}

if (failed) process.exitCode = 1;
