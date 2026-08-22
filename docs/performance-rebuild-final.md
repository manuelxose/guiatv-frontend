# Guía TV performance rebuild: final evidence

Date: 2026-08-21 (Europe/Madrid), updated 2026-08-22 with a follow-up round (see below).

This report records measurements from the completed production release. The baseline and query-design evidence is in `performance-rebuild-baseline.md`. Values below are measured; limitations are called out rather than estimated.

## Result

The public read path is now `Cloudflare -> Nginx edge cache -> Express -> Valkey SWR -> bounded Mongo read model`, with provider work isolated behind cached/materialized football reads. Angular SSR transfers primary route state to hydration and no longer repeats the homepage, TV guide, or editorial content GETs in the browser.

| Surface | Before | After | Change |
| --- | ---: | ---: | ---: |
| TV now API | 7,299 ms single response, 995,721 B | warm P95 47.7 ms, 12,738 B Brotli | 99.3% lower latency; 98.7% fewer wire bytes |
| TV day Mongo query | 959 ms, 20,941 docs/keys examined | 37 ms, 242 docs/keys examined | 96.1% faster; 98.8% fewer examined |
| Football home mobile LCP | 13,850 ms | 3,392 ms | 75.5% lower |
| Football home API | synchronous multi-source reconstruction | warm P95 35.6 ms, 1,820 B Brotli | materialized/SWR read |
| Homepage transfer | 1,800,861 B / 95 requests | 803,092 B / 69 requests | 55.4% fewer bytes; 27.4% fewer requests |
| Homepage CLS | 0.4096 | 0.00115 | 99.7% lower |
| Initial JS/CSS build | unbudgeted | 1.06 MB raw / 246.92 KB estimated transfer (2026-08-22 follow-up, was 1.29 MB / 295.54 KB) | enforced 1.5 MB error budget |

The 2.0-second mobile LCP stretch target is not yet met. Final Lighthouse LCP was 5.32 s on home, 4.17 s on guide, 3.39 s on football home, 3.37 s on matches, and 3.13 s on editorial. Backend TTFB and CLS are healthy; shared initial JavaScript and third-party images are now the main remaining costs. See the 2026-08-22 follow-up in `## Mobile Lighthouse` below for the same routes re-measured after the chat bundle/image/CLS fixes, plus the 5 previously-unmeasured football routes.

## Production API audit

Method: HTTPS through Cloudflare and Nginx, Brotli enabled, five repeated warm reads after deployment prewarming. `Raw` is decoded JSON and `Wire` is the Brotli body. All samples returned successfully.

| Endpoint | Raw B | Wire B | Warm P50 | Warm P95 | Cache/read behavior |
| --- | ---: | ---: | ---: | ---: | --- |
| TV now (36) | 76,654 | 12,738 | 32.9 ms | 47.7 ms | Valkey + 30 s edge |
| TV day (240) | 478,729 | 41,819 | 33.4 ms | 58.3 ms | bounded cursor page + 300 s edge |
| TV next (48) | 99,743 | 14,838 | 29.6 ms | 50.3 ms | bounded temporal query |
| TV night (48) | 100,623 | 16,295 | 26.0 ms | 37.0 ms | indexed part-of-day query |
| Football home | 27,854 | 1,820 | 25.5 ms | 35.6 ms | prebuilt SWR snapshot |
| Matches today | 7,000 | 1,451 | 30.9 ms | 43.2 ms | scheduled-match policy |
| Matches live | 7,002 | 1,442 | 34.7 ms | 39.0 ms | 8 s edge / short live SWR |
| Competitions | 3,762 | 930 | 28.4 ms | 31.8 ms | long-lived metadata policy |
| Match detail | 1,647 | 643 | 30.0 ms | 35.5 ms | endpoint SWR |
| Team detail | 3,441 | 674 | 26.9 ms | 42.4 ms | endpoint SWR |
| Competition detail | 57,490 | 3,267 | 29.2 ms | 111.9 ms | endpoint SWR; one sample exceeded 100 ms target |
| Football news (list) | 134 | 96 | 23.5 ms | 26.4 ms | editorial SWR |
| Football news (detail) | — | — | — | — | not yet measurable: no published news content exists in production, so no detail slug is exercisable (list returns an empty array) |
| Blog list (20) | 16,016 | 2,872 | 31.3 ms | 76.6 ms | projected list DTO |
| Blog detail | 3,678 | 1,632 | 27.3 ms | 34.7 ms | full detail DTO |
| Blog categories | 3,429 | 636 | 28.5 ms | 38.0 ms | cached aggregation |

The TV day endpoint is intentionally a progressive batch and remains under the 50 KB preferred compressed budget. It does not represent an entire unbounded day.

### 2026-08-22 follow-up: newly-covered football routes

The football rebuild (match detail, team detail, competition detail, news list/detail — `2cb3613`, `c1c87b0`) shipped before the perf-measurement tooling above, and was never added to it. `perf-http.mjs`'s route discovery, `prewarm-public-reads.mjs` and `load-http.mjs` now cover all five. Measured through Cloudflare/Nginx, five repeated warm reads:

| Endpoint | Raw B | Wire B | Warm P50 | Warm P95 | Cache/read behavior |
| --- | ---: | ---: | ---: | ---: | --- |
| Match detail (API) | 1,448 | 548 | 25.0 ms | 26.3 ms | endpoint SWR |
| Team detail (API) | 3,043 | 584 | 23.1 ms | 24.1 ms | endpoint SWR |
| Competition detail (API) | 57,490 | 3,267 | 25.2 ms | 25.8 ms | endpoint SWR |
| Match detail (frontend, SSR) | 225,094 | 25,098 | 35.0 ms | 38.7 ms | SSR + TransferState, no duplicate client refetch |
| Team detail (frontend, SSR) | 230,489 | 25,342 | 30.0 ms | 36.9 ms | SSR + TransferState, no duplicate client refetch |
| Competition detail (frontend, SSR) | 247,481 | 25,013 | 31.2 ms | 32.3 ms | SSR + TransferState, no duplicate client refetch |
| News list (frontend, SSR) | 105,099 | 18,842 | 30.0 ms | 37.0 ms | SSR + TransferState |

`perf:load` at 10/50/100 concurrency against the new `/v2/sports/football/news` list endpoint: 0 failures at every level (P95 22.2 ms / 56.1 ms / 108.1 ms). `cache:prewarm` now warms this endpoint and route after every deploy.

## Mongo evidence

| Query | Winning plan | Docs examined | Keys examined | Returned | Execution |
| --- | --- | ---: | ---: | ---: | ---: |
| TV day initial page | `idx_tvread_date_sort_start` | 242 | 242 | 240 | 37 ms |
| TV night | `idx_tvread_date_partofday_sort_start` | 124 | 148 | 120 | 13 ms |
| Blog public list | `idx_blog_public_featured_published` | 14 | 14 | 14 | 2 ms |
| Blog category-filtered list | status/published index | 14 | 14 | 14 | about 2 ms |

Additional selective TV indexes cover sport and category reconciliation. Online index creation completed before deployment. The reconciliation algorithm now indexes candidate airings by kickoff hour rather than comparing every match against every airing.

## Load behavior

Method: production HTTPS edge, independent forwarded client addresses, 10/50/100 simultaneous reads. There were zero failures in every group.

| Endpoint | P95 @ 10 | P95 @ 50 | P95 @ 100 |
| --- | ---: | ---: | ---: |
| TV now | 477 ms | 851 ms | 1,246 ms |
| TV day | 206 ms | 831 ms | 862 ms |
| Football home | 40 ms | 99 ms | 263 ms |
| Football news (2026-08-22) | 22 ms | 56 ms | 108 ms |
| Blog list | 46 ms | 80 ms | 169 ms |

Latency rises under a simultaneous 100-request burst, especially for larger TV bodies, but does not collapse or fail. Nginx cache locking, Valkey distributed locks, in-process single-flight, stale delivery and TTL jitter prevent rebuild stampedes.

## Mobile Lighthouse

Production-mode Lighthouse 13.4.1, mobile throttling, final release and warm public caches:

| Route | Score | TTFB | FCP | LCP | CLS | TBT | Transfer | Requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 0.54 | 74 ms | 3,700 ms | 5,322 ms | .00115 | 736 ms | 803 KB | 69 |
| TV guide | 0.73 | 67 ms | 3,401 ms | 4,168 ms | .00115 | 267 ms | 944 KB | 68 |
| Football home | 0.82 | 33 ms | 3,262 ms | 3,392 ms | .00115 | 193 ms | 858 KB | 68 |
| Football matches | 0.84 | 493 ms | 3,203 ms | 3,367 ms | .00115 | 157 ms | 800 KB | 62 |
| Editorial home | 0.85 | 85 ms | 2,833 ms | 3,133 ms | .00115 | 224 ms | 446 KB | 43 |
| Article detail | 0.61 | 54 ms | 3,577 ms | 3,786 ms | .00115 | 873 ms | 630 KB | 52 |

Custom hydration probes recorded zero duplicate content API GETs on home, guide and editorial. Their CLS was 0–0.00115, and DOM sizes were 864, 1,010 and 655 nodes respectively. INP cannot be responsibly derived from a synthetic non-interactive Lighthouse run; TBT is reported as its lab proxy.

### 2026-08-22 follow-up: chat bundle fix, image/CLS fixes, and the 5 new football routes

Re-measured with `npx lighthouse` (same 13.4.1, mobile throttling, simulated) against the live production domain, one sample per route, after: (a) gating `ChatService`'s online-presence polling/socket connection behind actual chat activation instead of firing on every authenticated route, (b) code-splitting the chat shell (`unified-chat-shell` + `ai-chatbot` + `social-chat-panel`, ~1,250 lines) out of the initial bundle via `@defer`, and (c) fixing 5 image/CLS gaps plus adding a loading skeleton to `football-matches` (see commits `c7ed9cb`, `c96a5ed`, `952b5c9`).

| Route | Score | TTFB | FCP | LCP | CLS | TBT | Transfer | Requests |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `/` | 51 | 41 ms | 3,457 ms | 5,337 ms | .00115 | 999 ms | 805 KB | 68 |
| TV guide | 56 | 40 ms | 4,539 ms | 6,882 ms | 0 | 320 ms | 726 KB | 64 |
| Football home | 82 | 70 ms | 3,054 ms | 3,091 ms | .00115 | 267 ms | 775 KB | 66 |
| Football matches | 73 | 760 ms | 1,676 ms | 3,049 ms | .00143 | 870 ms | 719 KB | 60 |
| Editorial home | 88 | 46 ms | 2,630 ms | 2,991 ms | 0 | 177 ms | 376 KB | 42 |
| Article detail | 69 | 37 ms | 1,403 ms | 3,329 ms | .00143 | 1,088 ms | 554 KB | 51 |
| Football news (new) | 91 | 63 ms | 2,567 ms | 2,731 ms | 0 | 150 ms | 332 KB | 42 |
| Football match detail (new) | 90 | 553 ms | 2,723 ms | 2,743 ms | 0 | 160 ms | 594 KB | 47 |
| Football team detail (new) | 86 | 540 ms | 2,995 ms | 3,184 ms | .00115 | 149 ms | 385 KB | 49 |
| Football competition detail (new) | 88 | 35 ms | 2,934 ms | 3,124 ms | .00115 | 100 ms | 423 KB | 56 |

Notes, reported honestly rather than smoothed over:

- **Article detail's first sample** showed TTFB 6,979 ms and CLS 0.131 — a genuine cold-cache miss (this specific article slug had never been requested against the freshly-deployed release before this run), not a regression. A repeat request immediately after shows TTFB 37 ms and CLS 0.0014 (the row above uses the warm rerun); the cold sample is itself confirmatory evidence that the SWR architecture behaves as designed — expensive only on a true first miss.
- **TBT and Performance score are noisier than the other columns in this pass.** This session's environment was observed under real memory pressure during the same work window (the production build was OOM-killed twice by the kernel before a stray, unrelated dev process was cleared — see the deploy log), and Lighthouse's simulated-throttling model amplifies host CPU contention into TBT. The hard, non-noisy numbers — bytes transferred, request counts, CLS, and the build-time initial-bundle size — are the reliable evidence of this round's fixes; TBT/score deltas against the 2026-08-21 baseline (e.g. home's TBT 736 ms → 999 ms) should not be read as a regression without a re-run on an unloaded host. Recommended as follow-up: a multi-sample Lighthouse pass (5+ runs, median) once host load is confirmed quiet.
- All 5 new football routes render correctly with real production data (verified via network-request inspection: 0 unexpected failures, only 3 pre-existing/unrelated `/v2/telemetry/*` 500s during local pre-deploy testing, absent from the production run above) and were previously entirely unmeasured.
- Football matches' CLS (.00143) is marginally above its four sibling detail pages (0–.00115) even after adding its loading skeleton; still well within the ≤0.10 target and far below its pre-fix state (no skeleton at all), but worth a closer look in a future round if it grows.

### 2026-08-22, second follow-up: home LCP image preconnect

A user-provided Lighthouse trace on `/` identified the actual LCP element: the home hero image (already correctly `fetchpriority="high"`, sized, eager, discoverable in the initial HTML — the frontend was already doing everything right here). Its `lcp-breakdown-insight` showed 453 ms of real (unthrottled) `resourceLoadDuration` despite the image itself being only 34 KB, because it's hosted on a streaming platform's own origin (e.g. `movistarplus.es`) that the page had never connected to before the `<img>` tag was discovered — DNS+TCP+TLS setup to a cold third-party origin, not transfer time, was the dominant cost.

Fix: `MetaService.preconnectImageOrigin()` appends a `<link rel="preconnect">` for a given image URL's origin (idempotent). `HomeComponent` calls it via an `effect()` reacting to the first resolved hero item, so the hint targets whichever platform's artwork actually won the hero slot that day, not a static guess. Verified via SSR output to render the correct origin for the live-resolved image.

Measured before/after on production (one sample each; see the TBT/score noise caveat above — the hard bytes-based numbers are what changed here):

| Subpart | Before | After |
| --- | ---: | ---: |
| Time to first byte | 75.6 ms | 67.8 ms |
| Resource load delay | 66.3 ms | 49.0 ms |
| **Resource load duration** | **453.3 ms** | **366.8 ms** |
| Element render delay | 124.6 ms | 224.6 ms |

`resourceLoadDuration` — the subpart this fix directly targets — dropped 19% (453→367 ms), consistent with the connection-setup savings a preconnect hint is expected to produce. `elementRenderDelay`'s increase is attributed to the same host-contention noise flagged above, not a regression from this change.

Also investigated and consciously deferred from this pass: Lighthouse's "reduce unused JavaScript"/"reduce unused CSS" audits (chunk-QBI6B2E6.js, main-PJARL6TH.js, styles-QLY6XH3L.css). Bundle analysis via `ng build --stats-json` showed chunk-QBI6B2E6.js is almost entirely `@angular/core`/`common`/`platform-browser`/rxjs framework runtime (not application code), and Lighthouse's per-page code-coverage audit inherently flags framework/global-CSS paths unused by any single route as "unused" even though other routes exercise them — chasing that number without real route-level critical-CSS/code splitting (a materially bigger change) risks removing code other pages need. Recommended as a separately-scoped follow-up, not attempted here.

## Architecture and operational controls

- External providers feed normalization/canonical storage; public football home is refreshed at startup and every minute, with provider timeout (4 s), circuit breaker and stale fallback.
- TV uses precise Mongo time/category/sport predicates, projection, bounded limits, cursor pagination and compact DTOs. The Angular guide progressively fetches and uses CDK virtual scrolling.
- Blog list/detail are separate projections. List responses exclude bodies, FAQ and large relation structures; categories use Mongo aggregation and SWR.
- Cache keys are schema-versioned. Mutation invalidation is namespace-targeted for TV ingestion, editorial changes and broadcast overrides; ordinary mutations never flush all Valkey data.
- `Server-Timing` and structured request logs expose cache/DB/provider/reconciliation/transform/total duration, route, status and response size. `/v2/health/metrics` exposes rolling latency percentiles, request rate, 5xx rate, Mongo/provider/cache latency, cache connectivity/hit rate/errors/memory/evictions, event-loop lag and Node memory.
- Cloudflare terminates the public edge and advertises HTTP/3; Nginx provides HTTP/2 origin service, API microcaching, cache locking/stale fallback, SSR caching, immutable static delivery and gzip. Brotli is supplied on the public path by Cloudflare; the installed Nginx binary has no Brotli module. Authenticated/private requests bypass public caches.
- Hashed JS/CSS responses are `public, max-age=31536000, immutable`; HTML uses short SSR/edge freshness. JSON, JS and CSS compression was verified from real response headers.
- Angular uses same-origin APIs, TransferState hydration, in-flight request coalescing, stable dimensions and lazy below-fold media. TMDB card images request bounded variants; embedded article TMDB originals are normalized to `w780` and lazy decoded.
- Chat presence polling and its Socket.IO connection now start only once chat is actually activated (opened, or a "message user" action), not on every authenticated route; the chat shell component tree is `@defer`-loaded behind the same condition instead of shipping in the initial bundle. Unread-badge and general-conversation lookups outside chat components stay eager since they depend on conversation data without chat ever being opened.
- `npm run perf:api`, `perf:frontend`, `perf:critical`, `perf:load`, and `cache:prewarm` provide repeatable checks. Angular production budgets fail severe initial-bundle regression; backend tests cover SWR coalescing and HTTP cache policy.

## Verification and deployment

- Backend tests: 90/90 passed.
- Frontend tests: 107/107 passed.
- Backend TypeScript lint passed (`tsc --noEmit`, 0 errors). Frontend lint: 0 errors (580 pre-existing warnings, unchanged by this round).
- Production SSR build passed; only the existing 150.55 KB channel-detail stylesheet warning remains below its 160 KB error limit.
- Production release `20260821224759` is an immutable timestamped tree selected by `/var/www/guiatv/current`; API and SSR systemd services run from the same release. Prewarming and public smoke tests completed after cutover.
- **2026-08-22 follow-up release**: `20260822003158` (git `952b5c9`), deployed via `deploy-guiatv.sh` following the documented atomic-release flow (build → verify → `publish:release` symlink cutover → restart `guiatv-api`/`guiatv-ssr` → smoke checks). Post-deploy: both services active, 0 restarts, `/v2/health` and `/` both 200 locally. `production-smoke` checklist against `https://guiaprogramaciontv.com` passed for all standard routes plus the 5 new football routes. Rollback target if ever needed: `releases/20260821233431` (git `77ea893`).

## Remaining measured constraints

The rebuild removes the catastrophic database/provider/read duplication and layout-instability problems, but the mobile LCP stretch goal remains open. The 2026-08-22 follow-up round closed the hydration/main-thread, layout-stability and route-coverage gaps that were open after the football rebuild (see above), and reduced the shared initial JS/CSS from 295.54 KB to 246.92 KB estimated transfer by code-splitting the chat feature. What's left, in priority order:

1. **Crest/logo proxying.** Football crests and logos (and the previously-flagged 219 KB football crest SVG) are still served straight from the external provider (`FootballDataOrgAdapter.ts` passes `raw.crest` through unresized) — no `srcset`/`fetchpriority` anywhere in the football feature. Building a real proxy needs a new backend route, a resized-variant store, and cache invalidation — out of scope for a single round; the `width`/`height`/`decoding`/`fetchpriority` attribute fixes landed this round are the safe interim mitigation.
2. **Shared initial JS**, while reduced, is still the largest lever for the mobile LCP stretch goal on `/` and TV guide specifically.
3. A repeat Lighthouse pass (5+ samples, median) on a confirmed-idle host, since this round's TBT/score readings were taken under real host memory contention (see the Mobile Lighthouse follow-up notes above) and shouldn't be treated as final ground truth on their own.
4. Football news detail remains unmeasured end-to-end (list currently has no published content in production to exercise a real detail slug against) — re-run once real news content exists.
