# 07 — Validation log (2026-10-19)

## Executed
| Command | Result |
|---|---|
| `node scripts/seo-crawl.mjs --out artifacts/seo/crawl-2026-10-19.json --probe …` (production) | 453 URLs + 13 probes; 265 flagged (238 are description-length only); structural findings in 01 |
| `node scripts/editorial-audit.mjs --json …` (production API) | 50 posts, 33 blocking, 40 with warnings (03) |
| `npm run build:frontend` equivalent: `ng build --configuration production --ssr` (×4) | succeeded; only pre-existing CommonJS warnings |
| `npm run seo:ssr-resilience` | 7/7 ok (503, `Cache-Control: no-store`, `noindex, nofollow`) |
| `ng test --watch=false --browsers=ChromeHeadlessNoSandbox` (full, Chromium 1248 via `CHROME_BIN`) | **254 / 254 SUCCESS** (final tree) |
| `apps/backend: npm run build` + `node --test "dist/**/*.test.js"` | **341 pass, 0 fail, 1 skipped** |
| `EditorialReviewPolicy.test.js` | 7 pass |
| `node scripts/gsc-compare.mjs --self-check` | ok |
| `eslint` on changed frontend files | 0 errors (pre-existing warnings only) |
| Local SSR (port 3101–3104) vs production API and vs dead API | behaviour tables in 01 |

## Not executed / blocked
- Playwright e2e (`npm run test:e2e`): not run — needs the web-server build + backend/Mongo; previously blocked by process contention per docs/adsense.
- Mobile/desktop rendered-DOM checks, axe, Lighthouse/CWV: not run (no quota / not in scope of the fixes).
- Googlebot view, URL Inspection, GSC, server logs: no access.
- Post-deploy crawl: impossible until deployed.
- `claude-seo` Python runtime (`setup`): not installed; installed skills not yet invokable in this session.
- Structured data eligibility (Google Rich Results Test): not run; only JSON syntax and type presence checked.

## Evidence files
`artifacts/seo/crawl-2026-10-19.json`, `blog-list-2026-10-19.json`, `blog-detail-metrics-2026-10-19.json`, `editorial-audit-2026-10-19.json`.

## Re-run after deploy
```
npm run seo:crawl -- --out artifacts/seo/crawl-post-deploy.json --probe /canales /editorial/zzz /programas/zzz
npm run seo:editorial-audit
curl -sI https://guiaprogramaciontv.com/canales | grep -i -E 'HTTP|cache-control|x-robots'
```
Expected: crawl exit 0 (descriptions ≤ 170 on programme pages), `/editorial/zzz` 404, no `x-ssr-cache` MISS storms.
