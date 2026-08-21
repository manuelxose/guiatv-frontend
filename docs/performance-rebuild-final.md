# Guía TV performance rebuild: final evidence

Date: 2026-08-21 (Europe/Madrid)

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
| Initial JS/CSS build | unbudgeted | 1.29 MB raw / 295.54 KB estimated transfer | enforced 1.5 MB error budget |

The 2.0-second mobile LCP stretch target is not yet met. Final Lighthouse LCP was 5.32 s on home, 4.17 s on guide, 3.39 s on football home, 3.37 s on matches, and 3.13 s on editorial. Backend TTFB and CLS are healthy; shared initial JavaScript and third-party images are now the main remaining costs.

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
| Football news | 134 | 96 | 27.0 ms | 41.3 ms | editorial SWR |
| Blog list (20) | 16,016 | 2,872 | 31.3 ms | 76.6 ms | projected list DTO |
| Blog detail | 3,678 | 1,632 | 27.3 ms | 34.7 ms | full detail DTO |
| Blog categories | 3,429 | 636 | 28.5 ms | 38.0 ms | cached aggregation |

The TV day endpoint is intentionally a progressive batch and remains under the 50 KB preferred compressed budget. It does not represent an entire unbounded day.

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

## Architecture and operational controls

- External providers feed normalization/canonical storage; public football home is refreshed at startup and every minute, with provider timeout (4 s), circuit breaker and stale fallback.
- TV uses precise Mongo time/category/sport predicates, projection, bounded limits, cursor pagination and compact DTOs. The Angular guide progressively fetches and uses CDK virtual scrolling.
- Blog list/detail are separate projections. List responses exclude bodies, FAQ and large relation structures; categories use Mongo aggregation and SWR.
- Cache keys are schema-versioned. Mutation invalidation is namespace-targeted for TV ingestion, editorial changes and broadcast overrides; ordinary mutations never flush all Valkey data.
- `Server-Timing` and structured request logs expose cache/DB/provider/reconciliation/transform/total duration, route, status and response size. `/v2/health/metrics` exposes rolling latency percentiles, request rate, 5xx rate, Mongo/provider/cache latency, cache connectivity/hit rate/errors/memory/evictions, event-loop lag and Node memory.
- Cloudflare terminates the public edge and advertises HTTP/3; Nginx provides HTTP/2 origin service, API microcaching, cache locking/stale fallback, SSR caching, immutable static delivery and gzip. Brotli is supplied on the public path by Cloudflare; the installed Nginx binary has no Brotli module. Authenticated/private requests bypass public caches.
- Hashed JS/CSS responses are `public, max-age=31536000, immutable`; HTML uses short SSR/edge freshness. JSON, JS and CSS compression was verified from real response headers.
- Angular uses same-origin APIs, TransferState hydration, in-flight request coalescing, stable dimensions and lazy below-fold media. TMDB card images request bounded variants; embedded article TMDB originals are normalized to `w780` and lazy decoded.
- `npm run perf:api`, `perf:frontend`, `perf:critical`, `perf:load`, and `cache:prewarm` provide repeatable checks. Angular production budgets fail severe initial-bundle regression; backend tests cover SWR coalescing and HTTP cache policy.

## Verification and deployment

- Backend tests: 90/90 passed.
- Frontend tests: 107/107 passed.
- Backend TypeScript lint passed.
- Production SSR build passed; only the existing 150.55 KB channel-detail stylesheet warning remains below its 160 KB error limit.
- Production release `20260821224759` is an immutable timestamped tree selected by `/var/www/guiatv/current`; API and SSR systemd services run from the same release. Prewarming and public smoke tests completed after cutover.

## Remaining measured constraints

The rebuild removes the catastrophic database/provider/read duplication and layout-instability problems, but the mobile LCP stretch goal remains open. The highest-leverage next work is reducing the shared 295 KB transferred initial JS/CSS, proxying/resizing externally hosted provider artwork (notably a 219 KB football crest SVG), and trimming image counts in the first mobile viewport. These are visible optimizations, not hidden backend blockers.
