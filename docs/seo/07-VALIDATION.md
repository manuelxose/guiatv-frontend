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

## Autonomous continuation — deployed validation

- PRs #7, #8 and #9 merged; final runtime commit `30b41e3`, release `20261019210550`.
- Final deployment `39307670951` and build/test workflow `39307670824`: **success**.
- Final frontend suite: **255 passed**; backend: **341 passed, 1 skipped**. SSR resilience: **11 routes passed**, including on an isolated SSR process on the VPS; crawler and GSC self-checks passed.
- Production build, local SSR checks for complete category counts / one article breadcrumb / canonical discovery 200, and mobile/desktop policy axe checks passed.
- Full crawl: 453 sitemap URLs + 3 probes, **15 URLs with findings**. Final stable-release recheck: **19 of 20 URLs returned 200**, with the known `/programas/deportes` 404 remaining. The four earlier 5xx responses did not recur in this recheck. Three short discovery surfaces and the 71-character Netflix-vs-Prime title remain flagged. The recheck is not another full crawl; see `artifacts/seo/crawl-final-recheck.json`.
- The two category noindex mismatches were fixed by loading all 52 approved posts instead of the API's default 50. Escaped metadata is decoded before length measurements; previous description-length flags did not remain on recheck.
- Google Rich Results Test on the final deployed Disney Plus article: **one valid Article + one valid BreadcrumbList**, with an optional author URL warning. Result: https://search.google.com/test/rich-results/result?id=T9NNpTlLKi7FsAv1NQjohw . Screenshot: `artifacts/seo/rich-results-final.png`.
- Lighthouse mobile lab run: performance 84 / accessibility 96 / best practices 96 / SEO 100. LCP 3.4s, TBT 290ms, CLS 0.001. This is one lab sample, not field CWV.
- Complete corpus audit: **52 posts, 35 with blocking findings**, 12 thin bodies. Content records have not been automatically approved or rewritten.
- Full Playwright suite remains **not passing / incomplete**; the interrupted attempt is documented in 08. This limitation is not erased by the narrower passing checks.

- Final targeted production probe: **21 routes, 18 successful pages and 3 expected unknown-URL 404s; no unexpected failures** (`artifacts/seo/post-deploy-targeted.json`).
- Authorized Search Console performance/indexing analysis completed privately; raw data and measured totals are not committed. Manual actions/security: no issues. Field CWV: insufficient data on both device types. No recovery claim.
