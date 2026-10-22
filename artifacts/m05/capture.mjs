// Re-run against a candidate with M05_ORIGIN=http://127.0.0.1:PORT M05_LABEL=candidate.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = process.env.M05_ORIGIN || 'https://guiaprogramaciontv.com';
const label = process.env.M05_LABEL || 'before';
const dir = new URL(`./${label}/`, import.meta.url);
await mkdir(dir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const samples = [ ['movie','american-gangster'], ['movie','bala-perdida'], ['series','breaking-bad'], ['series','sueos-de-libertad'], ['series','the-mysteries-of-laura-t1-e3-el-misterio-del-bar-de-moteros'], ['series','camino-a-la-perdicion'], ['movie','no-existe-m05-prueba'] ];
const results = [];
try {
for (const [kind, slug] of samples) {
  const path = `/${kind === 'movie' ? 'peliculas' : 'series'}/${slug}`;
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.__m05Vitals = { cls: 0, lcpMs: null };
    new PerformanceObserver(list => { for (const entry of list.getEntries()) if (!entry.hadRecentInput) window.__m05Vitals.cls += entry.value; }).observe({ type: 'layout-shift', buffered: true });
    new PerformanceObserver(list => { for (const entry of list.getEntries()) window.__m05Vitals.lcpMs = entry.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const apiMs = [], ssrMs = [];
  let api;
  for (let i=0; i<3; i++) {
    let at = performance.now(); const r = await fetch(`${origin}/v2/catalog/slug/${kind}/${slug}`); apiMs.push(Math.round(performance.now()-at)); api = { status:r.status, payload:await r.json() };
    at=performance.now(); const html=await fetch(`${origin}${path}`); await html.text(); ssrMs.push(Math.round(performance.now()-at));
  }
  const response = await page.goto(`${origin}${path}`, { waitUntil:'domcontentloaded', timeout:60000 });
  await page.locator('app-catalog-detail h1').waitFor({state:'visible',timeout:30000}).catch(()=>{});
  await page.waitForLoadState('networkidle', {timeout:10000}).catch(()=>{});
  const row={path,api,apiMs,ssrMs,status:response.status(),xRobots:response.headers()['x-robots-tag'], widths:[],errors};
  row.labVitals = await page.evaluate(() => window.__m05Vitals);
  for(const width of [375,768,1280,1440]) {
    await page.setViewportSize({width,height:900});
    await page.screenshot({path:new URL(`${slug}-${width}.png`,dir).pathname,fullPage:true});
    row.widths.push(await page.evaluate(()=>({width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1, heroHeight:document.querySelector('app-catalog-detail section')?.getBoundingClientRect().height})));
  }
  row.seo=await page.evaluate(()=>({title:document.title,description:document.querySelector('meta[name="description"]')?.content,robots:document.querySelector('meta[name="robots"]')?.content,canonical:[...document.querySelectorAll('link[rel="canonical"]')].map(x=>x.href),headings:[...document.querySelectorAll('h1,h2,h3')].map(x=>[x.tagName,x.textContent.trim()]),jsonld:[...document.querySelectorAll('script[type="application/ld+json"]')].map(x=>JSON.parse(x.textContent)),images:[...document.querySelectorAll('app-catalog-detail img')].map(x=>({src:x.currentSrc,loading:x.loading,width:x.naturalWidth})),links:[...document.querySelectorAll('app-catalog-detail a')].map(x=>x.getAttribute('href'))}));
  if(await page.locator('app-catalog-detail').count()) row.axe=(await new AxeBuilder({page}).include('app-catalog-detail').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>n.target)}));
  results.push(row); await context.close(); console.log(path,row.status,apiMs,ssrMs);
  await writeFile(new URL('report.json',dir),JSON.stringify({origin,takenAt:new Date().toISOString(),results},null,2));
}
} finally { await browser.close(); }
