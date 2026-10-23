// Read-only production evidence; M07_LABEL=after reruns the same samples after release.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const origin = process.env.M07_ORIGIN || 'https://guiaprogramaciontv.com';
const label = process.env.M07_LABEL || 'before';
const dir = new URL(`./${label}/`, import.meta.url);
await mkdir(dir, { recursive: true });
const surface = await (await fetch(`${origin}/v2/tv/surface/channels/la-1?date=today`)).json();
const current = surface.data.current || surface.data.next;
if (!current?.detailPath) throw new Error('No verified programme destination in channel surface');
const paths = ['/canales/la-1', current.detailPath, '/programacion-tv/en-directo'];
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const path of paths) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const ssrMs = [];
    for (let i = 0; i < 3; i++) {
      const at = performance.now();
      await (await fetch(`${origin}${path}`)).text();
      ssrMs.push(Math.round(performance.now() - at));
    }
    const response = await page.goto(`${origin}${path}`, { waitUntil: 'networkidle', timeout: 60000 });
    const root = path.startsWith('/canales/') ? 'app-canal-completo' : path.startsWith('/contenido/') ? 'app-catalog-detail' : 'app-live-guide-view';
    await page.locator(`${root} h1`).waitFor();
    const row = { path, status: response.status(), ssrMs, errors, widths: [], axe: [] };
    for (const width of [375, 768, 1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => document.documentElement.setAttribute('data-theme', theme), theme);
        await page.screenshot({ path: fileURLToPath(new URL(`${results.length}-${width}-${theme}.png`, dir)), fullPage: true });
        await page.screenshot({ path: fileURLToPath(new URL(`${results.length}-${width}-${theme}-viewport.png`, dir)) });
        row.widths.push({ theme, ...await page.evaluate(() => ({ width: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1 })) });
        const violations = (await new AxeBuilder({ page }).include(root).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
        row.axe.push(...violations.map(v => ({ width, theme, id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) })));
      }
    }
    row.seo = await page.evaluate(() => ({ title: document.title, robots: document.querySelector('meta[name="robots"]')?.content, canonical: [...document.querySelectorAll('link[rel="canonical"]')].map(x => x.href), jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map(x => JSON.parse(x.textContent)), headings: [...document.querySelectorAll('h1,h2')].map(x => x.textContent.trim()) }));
    results.push(row);
    await context.close();
    console.log(path, row.status, row.ssrMs, 'axe', row.axe.length);
    await writeFile(new URL('report.json', dir), JSON.stringify({ origin, at: new Date().toISOString(), results }, null, 2));
  }
} finally {
  await browser.close();
}
