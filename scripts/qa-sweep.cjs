/* QA sweep: axe (serious/critical) + horizontal overflow + console errors
 * across key routes, desktop + mobile, light + dark.
 */
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const BASE = 'http://localhost:3000';
const ROUTES = [
  '/',
  '/programacion-tv',
  '/programacion-tv/canales',
  '/programacion-tv/que-ver-hoy',
  '/programacion-tv/plataformas',
  '/programacion-tv/comparador',
  '/deportes/futbol',
  '/deportes/futbol/partidos',
  '/editorial',
  '/editorial/rankings',
  '/tendencias',
  '/para-ti',
  '/nosotros',
  '/sala-de-prensa',
  '/desarrolladores',
  '/terminos',
];

function summarize(violations) {
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}(${v.impact}) x${v.nodes.length}`)
    .join(', ');
}

(async () => {
  const browser = await chromium.launch({ args: ['--disable-web-security'] });
  const results = [];
  for (const theme of ['light', 'dark']) {
    for (const viewport of [
      { name: 'desktop', width: 1440, height: 900 },
      { name: 'mobile', width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const consoleErrors = [];
      page.on('console', (m) => {
        if (m.type() === 'error') consoleErrors.push(m.text());
      });
      for (const route of ROUTES) {
        try {
          await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 45000 });
          if (theme === 'dark') {
            await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
            await page.waitForTimeout(350);
          }
          // 1) horizontal overflow
          const overflow = await page.evaluate(() => {
            const w = document.documentElement.clientWidth;
            const bad = [];
            document.querySelectorAll('body *').forEach((el) => {
              const r = el.getBoundingClientRect();
              if (r.width > 0 && (r.right > w + 1 || r.left < -1)) {
                const cls = (el.className || '').toString().slice(0, 70);
                bad.push(`${el.tagName.toLowerCase()}.${cls} l=${Math.round(r.left)} r=${Math.round(r.right)}`);
              }
            });
            return { docW: w, scrollW: document.documentElement.scrollWidth, bad: bad.slice(0, 5) };
          });
          // 2) axe
          const axe = await new AxeBuilder({ page }).analyze();
          const summary = summarize(axe.violations);
          results.push({
            theme, viewport: viewport.name, route,
            overflow: overflow.scrollW > overflow.docW + 1 ? JSON.stringify(overflow) : '',
            axe: summary,
            console: consoleErrors.length ? consoleErrors.slice(0, 2).join(' | ') : '',
          });
          consoleErrors.length = 0;
        } catch (e) {
          results.push({ theme, viewport: viewport.name, route, error: String(e).slice(0, 120) });
        }
      }
      await context.close();
    }
  }
  await browser.close();
  const problems = results.filter((r) => r.overflow || r.axe || r.console || r.error);
  console.log(`Scanned ${results.length} page-views; problems: ${problems.length}`);
  problems.forEach((p) =>
    console.log(`${p.theme}/${p.viewport.name} ${p.route}${p.error ? ' ERROR: ' + p.error : ''}${p.overflow ? ' OVERFLOW: ' + p.overflow : ''}${p.axe ? ' AXE: ' + p.axe : ''}${p.console ? ' CONSOLE: ' + p.console : ''}`)
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
