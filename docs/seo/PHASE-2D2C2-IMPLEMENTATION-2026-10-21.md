# Phase 2D-2C.2: SSR cold-render performance

Branch `perf/ssr-2d2c2-cold-render`, from `main` at `b2c6d9f` (PR #35, production release `20261021113838`). Not merged or deployed. **[V]** verified, **[E]** estimate, **[P]** proposal.

## 1. Baseline and method [V]

- **Production, loopback, one at a time, not a crawl.** Cold renders of 6 random sitemap programme pages took **0.48–0.80 s**. Each made about 5 API calls (slug, enrichment, providers, 2 related lists), all under 165 ms. gi-joe rendered live in 0.37–0.50 s. Detail pages are not slow on their own.
- **Local A/B.** I copied the production release's SSR build (`server/` plus browser HTML/CSS) and the candidate build, built from this branch on the Windows clone. Both ran against a record/replay proxy of the production API, which hit production once per unique request and replays from then on.
  - Metrics: per-render wall time and SSR-process CPU (`/proc`), 11 pages one at a time, and 40 detail pages at concurrency 6 (the crawl's worker count).
  - Both builds were measured with the same harness.

## 2. Root causes, by measured contribution

| # | Finding | Evidence | Effect |
|---|---|---|---|
| 1 | **The affiliate resolve POST hairpinned through Cloudflare with no client timeout** (`InternalApiBackend` rewrote GET/HEAD only). | Production at 09:49:47 UTC: gi-joe and la-trama finished slug (60 ms), enrichment and providers (≤ 300 ms), then nothing until the SSR timeout at 09:50:07. The affiliate POST is the only call left in that waterfall and the only one leaving the box. nginx shows affiliate POSTs that **hung 30 s (504, 11:04:15 local)** and **429s in every crawl** (Cloudflare IPs share one rate-limit bucket). Local reproduction with a stalled affiliate endpoint: **every detail page 503 at 20.1 s.** | The 20 s timeouts (503) |
| 2 | **An idle 300 ms in every render.** `UnifiedSearchComponent` (top nav, every page) ran `startWith` + `debounceTime(300)` on the server, and Angular SSR waits for that timer. | `async_hooks` trace: all fetches done at +78 ms, a 300 ms `setInterval` (the RxJS async scheduler) created at +7 ms, response at +329 ms. Patching only that value on the production bundle: detail pages 320 → 53–107 ms. | +300 ms on every cold page |
| 3 | **The slug lookup walked the whole day.** `findOne({date, 'program.title'}).sort({'airing.start'})` has no title index. | Production `explain` (read-only): `idx_tvread_date_airing_window`, **11,697 docs examined, 499 ms**. With the title token that found the title: `idx_tvread_search_tokens`, **2 docs, 2–5 ms**, same airing. | Database load on every cold programme page |
| — | Runtime critical-CSS inlining (Beasties) | A/B with `inlineCriticalCss: false`: 84 vs 81 ms CPU/page, 13.8 vs 13.9 pages/s | **Not a bottleneck.** Unchanged |
| — | Home transfer state 795 KB (68% of 1.16 MB HTML) | `portal-home-state-v3` (352 KB) duplicates `/v2/discovery/home` (168 KB); tv/read and football are also duplicated (~415 KB in total) | Follow-up (§7): the snapshot exists for a documented hydration reason |

## 3. Changes

1. **`unified-search.component.ts`:** the suggestions pipeline is browser-only. On the server the initial emission only re-set the same query (`searchQuery.set`), so it was a no-op there.
2. **`internal-api.backend.ts`:**
   - `POST /v2/affiliate/resolve` is a `READ_SHAPED_POSTS` entry. `resolveOffers` writes nothing; its only `.set` calls build URL parameters. It now takes the internal route like reads. Every other POST stays public.
   - **Every SSR API request is capped at 6 s** and fails as an HTTP 504. Optional sections already fall back to empty (`catchError`); required data still gives the page's 503. The deepest chain is three calls, so a stall can no longer consume the 20 s render budget.
3. **`rateLimit.ts`:** `isDirectLocalRead` also exempts that POST from loopback without forwarding headers. Otherwise all SSR renders would share one 100/min loopback bucket (the reason it was left public in 2D-0B). nginx-proxied requests are never exempt.
4. **`CatalogService.findTvReadItemBySlug`:** the exact-title fetch adds the token that found the title, but only when the token belongs to the title itself. The read model builds `searchTokens` from the stored `program.title`, so every airing of the title carries it and the result is the same airing. A channel or category token keeps the old filter.

Not changed: MongoDB pool, SSR timeout (20 s), SSR cache, indexes, canonical rules, routes, sitemaps.

## 4. Before/after [V]

Same build pipeline and same replayed production data:

| Measure | Baseline (prod build) | Candidate | Note |
|---|---|---|---|
| Cold detail page, one at a time (9 pages) | 320–325 ms | **64–97 ms** | 3–5× |
| `/` one at a time | 426 ms | **179 ms** | |
| HTML bytes (all 11 pages) | — | identical | no content removed |
| 40 detail pages at concurrency 6, p50 / p95 / max | 429 / 594 / 606 ms | 426 / **501** / 662 ms | CPU-bound locally |
| Throughput at concurrency 6 | 13.3 pages/s | 14.1 pages/s | CPU per page unchanged (86–87 ms) |
| **Affiliate dependency stalled** (3 detail pages) | **503 at 20.1 s**, no H1, no canonical | **200 at 6.6 s**, H1 and canonical present | the production failure mode |
| Required API stalled (`/canales/la-sexta`) | 503 at 20.07 s | **503 at 6.3 s** (noindex) | CI regression |
| Slug fetch, production `explain` | 11,697 docs, 499 ms | 2 docs, 2–5 ms | same airing |

Targets:
- **Zero avoidable 503s in the regression crawl:** the reproduced cause is fixed, and production confirmation is pending (§6).
- **Cold detail p95 under 5 s:** met locally (0.5 s at concurrency 6). [E] On production, CPU per render is about 3–4× higher.
- **No 20 s timeouts under bounded concurrency:** no single dependency can hold a render for more than 6 s per call any more.
- **CPU-bound ceiling:** throughput at concurrency 6 is CPU-bound and only slightly improved. Reducing render CPU (home transfer state, `formatTime` at about 16% of busy CPU in the profile) is the next lever.

## 5. Tests [V]

| Check | Result |
|---|---|
| Backend `npm test` | 392 tests: 389 pass, 0 fail, 3 skip |
| New backend tests | `isDirectLocalRead` (resolve exempt only from loopback without forwarding headers; impression and login are not); slug fetch narrowed only by a title token |
| Frontend `tsc` (app + spec) | 0 errors; eslint 0 errors |
| New Karma specs (CI) | resolve POST rewritten, other POSTs and other hosts not; stalled request gives 504 after exactly `SSR_API_TIMEOUT_MS` (fakeAsync), prompt request passes |
| `seo-ssr-resilience` against the candidate build | all sections pass, including 2D-0B (12 SSR API requests on `API_ORIGIN`, no visitor credentials), legacy 301/404/410/503, SWR single-flight, and the **new stalled-API section** (503 noindex in 6.3 s) |
| Red check | the stalled-API section fails on the production build (20,072 ms) |
| Production SSR build (Windows) | OK, initial bundle 1.10 MB raw / 259 kB transfer, no budget errors |

## 6. Production plan [P]

1. **Read-only baseline before the deploy:** the nginx 503 count, `SSR render timeout` count and affiliate 429/504 count since the PR #35 deploy (interim at 10:23 UTC: 2,821 requests, 2 × 503, both crawl render timeouts; legacy `/contenido/program:*` 0 × 503; 5 affiliate 429s).
2. **Merge (separate authorisation).** The API and SSR ship together, and the API restarts first, so the rate-limit exemption is live before the SSR uses loopback. The deploy log must show the `SSR warm-up` lines; this is the first deploy that runs them (§7 of the 2D-2C.1 report).
3. **Smoke checks:**
   - live cold renders (`Cookie: session=probe` bypasses the page cache) of 6 sitemap programme pages: expect under 0.5 s on an idle box;
   - the API log shows `/v2/affiliate/resolve` from `::ffff:127.0.0.1`, no Cloudflare IP;
   - warm HIT/STALE unchanged.
4. **Bounded production crawl** (907 URLs, 6 workers). Target: 0 × 503, 0 `SSR render timeout`, 0 affiliate 429.
5. **Monitoring for 24 h:** nginx 503s, `SSR render timeout`, `[SSR] stale refresh … -> 5xx`, API `MongoWaitQueueTimeoutError`.
6. **Rollback if any of these appear:**
   - any API 429 on loopback;
   - render timeouts above the pre-deploy rate;
   - pages missing H1 or canonical in the crawl;
   - 5xx above baseline.

   To roll back, revert the merge or repoint `current` to `20261021113838`. No data or index changes.

**24-hour legacy-URL comparison: not complete.** The window closes 2026-10-22 09:38 UTC.

## 7. Remaining risks and follow-ups

- **The loopback exemption trusts any local process** for this one read-only POST, as it already does for GETs. Upgrade path: an SSR credential.
- **6 s cap:** a legitimately slow call (the providers endpoint's own TMDB timeout is 8 s) now renders without that optional section instead of waiting. The section loads in the browser after hydration.
- **Home transfer state:** about 415 KB of duplicate state per home render. Removing the facade snapshot needs browser hydration validation (empty-state flash guard).
- **`formatTime`:** the hottest application function, about 16% of busy render CPU, in two chunks. Likely a per-call `Intl.DateTimeFormat`.
- **Production CPU per render is about 3–4× local,** so concurrency-6 throughput on the VPS is CPU-bound. Measure after the deploy before any further change.
