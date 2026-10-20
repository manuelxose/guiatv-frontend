// Counts the /v2 API requests a browser makes after loading a server-rendered page. With a working HTTP transfer
// cache, the requests SSR already made are not repeated, so this measures duplicate fetches on hydration.
// Usage: node hydration-refetch.mjs <base-url> <out.json>   (needs Playwright with Chromium)
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.argv[2];
const OUT = process.argv[3];
const paths = ['/', '/canales', '/canales/la-1', '/programacion-tv/peliculas', '/guias', '/guias/precios-plataformas-streaming-espana', '/peliculas/elvis', '/series/friends', '/deportes/futbol'];
const browser = await chromium.launch();
const ctx = await browser.newContext({ locale: 'es-ES', timezoneId: 'Europe/Madrid', userAgent: 'Mozilla/5.0 (compatible; guiatv-2d0b-audit) Chrome/130' });
const rows = [];
for (const path of paths) {
  const page = await ctx.newPage();
  const api = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.pathname.startsWith('/v2/') && !url.pathname.startsWith('/v2/ws') && !url.pathname.startsWith('/v2/telemetry')) {
      api.push(`${req.method()} ${url.pathname}`);
    }
  });
  const res = await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 }).catch(() => null);
  await page.waitForTimeout(1500);
  rows.push({ path, status: res?.status() ?? null, browserApiRequests: api.length, requests: api.sort() });
  await page.close();
}
await browser.close();
fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
for (const r of rows) console.log(`${r.path} ${r.status} browser /v2 requests: ${r.browserApiRequests}`);
