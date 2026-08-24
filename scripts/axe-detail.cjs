const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const route = process.argv[2] || '/deportes/futbol';
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://localhost:3000' + route, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(4000);
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(1000);
  const axe = await new AxeBuilder({ page }).analyze();
  const seen = new Map();
  for (const v of axe.violations) {
    if (v.impact !== 'serious' && v.impact !== 'critical') continue;
    for (const node of v.nodes) {
      const key = node.html.slice(0, 120);
      if (!seen.has(key)) seen.set(key, { id: v.id, summary: node.failureSummary?.replace(/\s+/g, ' ').slice(0, 140) });
    }
  }
  let i = 0;
  for (const [html, info] of seen) {
    console.log(`${(++i)}. [${info.id}] ${html}`);
    console.log('   ', info.summary);
  }
  console.log('TOTAL serious unique:', seen.size);
  await browser.close();
})();
