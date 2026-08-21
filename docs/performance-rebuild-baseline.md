# Guía TV performance rebuild baseline

Date: 2026-08-21 (Europe/Madrid)

This document records the state observed before the performance rebuild. Numbers below are measurements, not targets or estimates. Historical measurements are identified separately and are not treated as the current baseline.

## Repository and protected working state

- Repository: `/var/www/guiatv` (`manuelxose/guiatv-frontend`)
- Branch: `feat/navigation-blog-platforms-unification`, tracking its origin branch.
- Pre-existing modified files are confined to the root application shell and AI chat components: `app.component.{html,scss,ts}` plus four `ai-chatbot` child files. They are unrelated user work and must remain intact.
- Governing instructions inspected: `AGENTS.md`, `CLAUDE.md`, root/backend/frontend READMEs.
- Existing rebuild evidence inspected: `docs/rebuild-scoreboard.md`, `docs/rebuild-audit-round1.md`, `docs/frontend-rebuild-audit.md`, `docs/tv-read-model-audit-2026-03-20.md`, and `docs/release-workflow.md`.

## Production topology observed

```text
browser
  -> nginx 1.24 (TLS + HTTP/2, guiaprogramaciontv.com)
     -> /v2 and API aliases: Node/Express API on 127.0.0.1:4000
     -> page routes: nginx SSR cache (5 minutes) -> Angular SSR on 127.0.0.1:3000
     -> hashed static assets: nginx filesystem delivery from current release
  -> Valkey on 127.0.0.1:6379
  -> MongoDB on 127.0.0.1:27017
```

- The API and SSR systemd services are active and execute from the unified `current` release tree. The release symlink and exact unit configuration are operational state and must be rechecked at deployment time.
- API configuration is loaded from `/etc/guiatv/api.env`; SSR configuration is loaded from `/etc/guiatv/ssr.env`. Only variable names were inspected. No secret values were copied.
- The API environment declares Mongo pool/connect settings and Valkey cache/connect settings. Runtime behavior still requires instrumentation and health verification.
- Nginx has gzip enabled globally, but the effective global `gzip_types` expansion is commented. Brotli was not found in the loaded configuration. Actual content encoding must be verified by request.
- No evidence of an external CDN was found in repository or loaded nginx configuration. This is not proof that DNS has no upstream proxy and must be verified independently before introducing one.
- Nginx currently caches SSR responses for five minutes and bypasses that cache for session cookies or authorization.
- Express globally disables ETags and overwrites all ordinary API responses with `Cache-Control: no-store`, `Pragma: no-cache`, and expired dates. This prevents deliberate browser/edge caching for public stable reads.

## Critical API contracts currently consumed

TV reads:

- `GET /v2/tv/read?view=now|next|night|day|search&date=&group=&category=&sport=&channelId=&q=&limit=&cursor=` returns `{date, view, items, channels, filters, meta}`.
- `GET /v2/tv/read/channels` returns channel summaries.
- `GET /v2/tv/read/channels/:channelId` returns the rich read response.
- `GET /v2/tv/read/items/:airingId` returns the item and bounded related channel items.
- `GET /v2/tv/surface/guide` and `/v2/tv/surface/channels/:channelId` are frontend BFF surfaces.

Football reads:

- `/v2/sports/football/home`, `/matches`, `/matches/live`, `/matches/:idOrSlug`, `/competitions`, `/competitions/:slug`, `/teams/:slug`, `/news`, and `/search`.
- Home includes live/today/featured/upcoming matches, featured competitions and latest news.

Editorial reads:

- The frontend uses `/v2/blog`; the same router is also mounted as a root compatibility alias at `/blog`.
- `GET /v2/blog` is the public list, while `GET /v2/blog?slug=...` is the detail lookup.
- `GET /v2/blog/categories` returns category counts.
- At baseline the list and detail shared one full-document representation. The first rebuild change splits the public list projection from slug/admin detail while keeping these URLs compatible.

Angular SSR uses hydration with event replay and Angular HTTP transfer caching. Several football requests also use manual `TransferState`, so duplicate/unbounded serialization must be measured rather than assumed absent.

## Source-level latency chain findings

### TV / EPG

- `day` defaults to 5,000 items and permits 20,000.
- The Mongo query has no projection, database limit, or keyset cursor. It reads every matching rich document, then hydrates, visibility-filters, sport-filters, sorts, summarizes, and slices in Node.
- Only `now` receives a precise temporal Mongo predicate. `next`, `night`, `day`, and search remain broad; night adds only a part-of-day predicate.
- The channels metadata endpoint obtains summaries by executing the 5,000-item day path.
- Cache keys are unversioned. There is no SWR, TTL jitter, or single-flight protection.
- Existing indexes do not fully cover the common ungrouped sort, night/category/sport paths, or consumer visibility predicates. All new candidates require `explain("executionStats")` evidence before acceptance.

### Football

- Only home (45 seconds), live (15 seconds), and competitions (6 hours) have explicit caches.
- A cold home request performs three provider calls in parallel, then reconciliation, then competitions and news sequentially before it can cache the result.
- Concurrent misses are not coalesced and there is no stale response envelope or prebuilt home snapshot.
- Matches, match detail, competition/team detail, news and search lack differentiated endpoint caches. Football news maps away article bodies but does not project them out of Mongo reads.

### Editorial/blog

- Baseline public list Mongo queries loaded full article bodies and serialized `content.rendered` for every card.
- Baseline category calculation loaded every category array and counted in Node.
- Main public list ordering starts with `featured`, but the existing index is only `{status, publishedAt}`. The exact measured query needs a matching index candidate and explain evidence.

### Frontend / SSR

- The primary live guide component subscribes to now, next, night, day and a browser-only surface eagerly, causing up to five initial reads.
- SSR gates the visible guide on the browser-only surface and can emit a spinner despite fetching underlying data.
- Legacy TV state explicitly requests up to 5,000 records.
- The active EPG grid renders all rows/cells without viewport virtualization.
- The TV API client caches completed responses but does not coalesce concurrent in-flight requests.
- Production Angular configuration has no bundle budgets. Chat/auth shell code is imported at the root.
- Several critical images use plain `src`, lack intrinsic dimensions/responsive sources, and the home hero references the same high-priority image twice.

## Initial measured evidence

Measurement method: direct loopback `curl` against the running production API, one sequential cold/warm-unspecified pass. These figures are diagnostic only; percentile claims require the repeatable harness added later.

| Endpoint | Status | Total | Bytes | Note |
| --- | ---: | ---: | ---: | --- |
| `/v2/health` | 200 | 2.281 s | 245 | Loopback response is already far above budget. |
| `/v2/tv/read?view=now&limit=120` | 200 | 7.299 s | 995,721 | Nearly 1 MB uncompressed body for the initial now view. |

The sequential probe exceeded its 30-second command window immediately after these two responses. That timeout is itself evidence of an unhealthy chain, but it is not assigned to an individual later endpoint. Future measurements must use per-request timeouts and independent repetitions.

Historical evidence in `docs/rebuild-scoreboard.md` reports other dates and query shapes; it is retained for context but cannot substitute for current before/after measurements.

## Performance budgets

- Cached public API: P50 below 30 ms, P95 below 100 ms, P99 below 250 ms where infrastructure permits.
- Uncached Mongo reads: P50 below 80 ms, P95 below 200 ms, P99 below 400 ms.
- Typical list response: below 100 KB compressed, preferably below 50 KB for initial above-fold data.
- Mobile UX: meaningful above-fold content around 1 second on normal broadband/4G; LCP below 2.0 s, INP below 200 ms, CLS below 0.1.

## Evidence still required

- Independent cold/warm repetitions and P50/P95/P99 for every mandated endpoint.
- Raw and gzip/Brotli bytes, item counts and cache hit tier.
- Mongo winning plans, keys/docs examined, returned rows and execution time for each hot query.
- Provider, reconciliation, cache, transform, serialization and total timings via structured metrics and `Server-Timing`.
- SSR TTFB/HTML bytes, hydration duration and duplicate network count.
- Production bundle stats, mobile Lighthouse/Web Vitals and 10/50/100-client load tests.
- Effective public-origin CDN and compression behavior.

No final performance claim is valid until those artifacts are captured after the implementation and compared with equivalent baseline shapes.

## First controlled rebuild measurements

These are implementation-round measurements from an isolated backend on port 4100 using the production MongoDB and Valkey. They are retained here so query decisions remain auditable; the final document must repeat them against the completed release.

Mongo `explain("executionStats")` evidence:

| Query | Before | After | Winning index after |
| --- | --- | --- | --- |
| TV day, limit 240 | 959ms; 20,941 docs/keys examined | 37ms; 242 docs/keys examined | `idx_tvread_date_sort_start` |
| TV night, limit 120 | 53ms; 1,796 docs examined | 13ms; 124 docs and 148 keys examined | `idx_tvread_date_partofday_sort_start` |
| Football reconciliation candidates | 576ms; 48,270 docs and 48,300 keys examined | 239ms; 6,973 docs and 9,629 keys examined | OR merge of `idx_tvread_sport_date_start` and `idx_tvread_category_date_start` |

Isolated API samples after the first cache/DTO pass (`5` concurrent warm samples; response `bytes` are decompressed bytes reported by Node fetch):

| Endpoint | Cold | Warm P95 | Bytes |
| --- | ---: | ---: | ---: |
| TV now, 36 items, no channel summaries | 1,252ms | 73ms | 75,949 cold; a cache-hydration inflation defect was detected and fixed afterward |
| TV day, 240 items, no channel summaries | 270ms | 287ms | 478,663 cold; same warm inflation defect fixed afterward |
| Football home, stale cache | 63ms | 56ms | 27,942 |
| Football live, cold | 7,223ms | 108ms | 7,024 |
| Editorial list, 20 | 13ms | 50ms | 16,016 |
| Editorial categories | 19ms | 102ms | 3,429 |

The phase headers isolated football reconciliation (5.7–9.8 seconds on uncached samples) as the next cold-path bottleneck. The remediation added a projected, versioned SWR reconciliation read model plus query-shaped indexes; it still requires a clean post-build benchmark.
