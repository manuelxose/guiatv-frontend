import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.argv[2] || 'https://guiaprogramaciontv.com';
const OUT = process.argv[3];
const urls = [
 ['Home','/'], ['Home ?utm','/?utm_source=test'], ['Channel','/canales/la-1'], ['Channel ?dia','/canales/la-1?dia=manana'],
 ['Programme','/programas/the-last-ship'], ['Programme season suffix','/programas/friends-t3'], ['Programme accent-dropped','/programas/espejo-pblico'],
 ['Series','/series/friends'], ['Series noindex','/series/la-promesa'], ['Movie','/peliculas/elvis'], ['Movie wrong TMDB bind','/peliculas/2'],
 ['Guide','/guias/precios-plataformas-streaming-espana'], ['Football hub','/deportes/futbol'], ['Football today','/deportes/futbol/partidos-hoy'],
 ['Match canonical','/deportes/futbol/partido/ca-paranaense-se-palmeiras-2026-10-18'], ['Match legacy','/deportes/futbol/partido/ca-paranaense-se-palmeiras-2026-10-17'],
 ['Match missing','/deportes/futbol/partido/equipo-a-equipo-b-2026-01-01'],
 ['Redirect','/programacion-tv/guia-canales'], ['Redirect legacy catalog','/contenido/program:20260901_la_1_20260901150000'],
 ['Noindex (login)','/iniciar-sesion'], ['Noindex (tendencias?)','/tendencias'], ['Unknown 404','/no-existe-2d0'], ['Unknown programme 404','/programas/no-existe-2d0'],
 ['Widget','/embed/programacion'], ['Embed landing','/embed'], ['Legal','/avisolegal'],
];
const pick = (html, re) => [...html.matchAll(re)].map(m=>m[1]);
const browser = await chromium.launch();
const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (compatible; guiatv-2d0-audit) Chrome/130', locale: 'es-ES', timezoneId: 'Europe/Madrid' });
const rows = [];
for (const [name, p] of urls) {
  const r = await fetch(BASE + p, { redirect: 'manual', headers: { 'user-agent': 'Mozilla/5.0 (compatible; guiatv-2d0-audit)' } });
  const html = r.status === 200 || r.status >= 400 ? await r.text() : '';
  const raw = pick(html, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/g);
  const robots = pick(html, /<meta[^>]*name="robots"[^>]*content="([^"]*)"/g);
  const ld = pick(html, /"url":"([^"]*\/(?:deportes|programas|series|peliculas|guias|canales)[^"]*)"/g).slice(0,3);
  let dom = [], domRobots = [];
  if (r.status === 200) {
    const page = await ctx.newPage();
    try { await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 45000 }); } catch {}
    await page.waitForTimeout(1500);
    dom = await page.$$eval('link[rel="canonical"]', ls => ls.map(l => l.href));
    domRobots = await page.$$eval('meta[name="robots"]', ls => ls.map(l => l.content));
    await page.close();
  }
  const strip = u => u.replace(/^https:\/\/guiaprogramaciontv\.com/, '');
  const row = { name, path: p, status: r.status, location: r.headers.get('location') || '', rawCanonical: raw.map(strip), domCanonical: dom.map(u=>strip(u).replace(/^http:\/\/127\.0\.0\.1:\d+/,'')), rawRobots: robots[0]||'', domRobots: domRobots[0]||'', xRobots: r.headers.get('x-robots-tag')||'', fallback: r.headers.get('x-ssr-canonical')||'', jsonLdUrls: ld.map(strip) };
  row.consistent = row.rawCanonical.length <= 1 && row.domCanonical.length <= 1 && (r.status !== 200 || row.rawCanonical[0] === row.domCanonical[0]);
  rows.push(row); console.log(JSON.stringify(row));
  await new Promise(res => setTimeout(res, 800));
}
await browser.close();
fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));
