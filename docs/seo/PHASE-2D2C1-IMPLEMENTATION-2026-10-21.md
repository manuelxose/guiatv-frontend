# Phase 2D-2C.1: legacy URL semantics and SSR cold-start hardening

Branch `fix/seo-2d2c1-legacy-503`, from `main` at `81610f2`. PR #35 is not merged or deployed. **[V]** verified, **[E]** estimate, **[P]** proposal.

## 1. Root cause of the legacy 503s [V]

`/contenido/:id`, `/detalles/:id`, `/program-full-details/:id` and `/pelicula-details/:id` are handled by `redirectLegacyCatalog` in `ssr-server.mjs`, which calls `GET /v2/catalog/:id`. For `program:<airing id>`, that call goes through `CatalogService.getProgramDetail` and then `TvReadQueryService.getItem`.

When the airing has left the read model, `getItem` threw a plain `Error('TV read item not found: …')`. The global `errorHandler` only maps `AppError` subclasses to their status, so the API answered **500** (745 times in 24 h in production). The SSR treats any status other than 404/410 as an outage and answers **503 + `Retry-After: 120`**.

Result: 306 of the 319 503s on 2026-10-21 (about 1,200 on 10-20) were bots, mostly bingbot, retrying dead legacy URLs.

## 2. Request classes and correction

| Class | Evidence | Before | After |
|---|---|---|---|
| 1. Existing item, verified destination | API 200 with a same-site `detailPath` | 301 | 301 (unchanged) |
| 2. Permanently removed | API says 410 | 404 (flattened) | **410** passed through |
| 3. Missing, no proof of permanent removal | API 404 | 503 (API 500) | **404** |
| 4. Database or application failure | API 5xx, timeout, or unreachable | 503 | 503 + Retry-After, noindex (unchanged) |
| 5. Unroutable or ambiguous destination | API 200 with `detailPath` `/`, `//host`, missing, or equal to the request | 301 to it (or 404) | **404**, never a guessed redirect |

- **Fix:** `getItem` now throws `NotFoundError('TV read item', id)`, which is a 404. Database errors still propagate as 5xx, and a test covers both. This is one change in the shared function, so all three callers (catalog detail, `/enrichment` and `/v2/tv/items/:id`) get the correct status.
- **No 410 yet:** the API never returns 410 today. The 2C policy (§G, legacy-pattern row) allows 410 for an expired airing only when it has **no entity**, and that can't be established before 2D-3 entity resolution. Expired ids therefore get 404, which is reversible. A 410 issued now would tell Google to drop URLs that 2D-3 may later 301 to an entity.
- **Body agrees with status:** 404 and 410 bodies are plain `Not found` / `Gone`, with no app shell and no canonical (tested). The 503 is the existing noindex CSR fallback.

## 3. SSR cold start [V]

Measured on production 2026-10-21 at 09:04 UTC, loopback, sequential, no crawl running:

| Page | Miss | Hit |
|---|---|---|
| `/` | 22.0 s | 8 ms |
| `/programacion-tv/que-ver-hoy` | 11.5 s | 8 ms |
| `/programacion-tv/series` | 6.0 s | 5 ms |
| `/programacion-tv/en-directo` | 5.4 s | 7 ms |
| `/plataformas` | 3.6 s | 8 ms |
| `/guias` | 1.9 s | 5 ms |

- Individual API calls behind them took up to about 4 s. The home render fans out to many of them, including per-programme `/enrichment`.
- The deploy smoke checks had already rendered `/plataformas` and `/en-directo`, yet both timed out 6 minutes later. The SSR cache TTL is 5 minutes and expired entries were deleted, so the warm-up was gone.
- **Conclusion:** a render-concurrency gate is not justified, because single renders are slow already and a gate would only reorder the timeouts. What is justified is keeping a rendered copy servable while one render replaces it.

### Implementation

- **Stale-while-revalidate** (`ssr-server.mjs`):
  - An entry is fresh for 5 minutes (`HIT`). After that it is served as `STALE` for up to 30 minutes (`s-maxage=60`), and one background render per path (single-flight) runs through the server's own pipeline, so the status, robots, canonical and cache rules all apply.
  - 5xx results are never cached. A failed refresh keeps the stale copy and logs `[SSR] stale refresh <path> -> <status>`.
  - Refresh requests carry a random per-process token, so a public request can't bypass the cache.
  - After 30 minutes, requests render live again.
- **Post-deploy warm-up** (`deploy-guiatv.sh`, after the smoke checks):
  - 10 hub pages are rendered sequentially, each capped at 25 s, with no retries.
  - Only a 200 counts as warm, so a 503 fallback is never reported as a render.
  - One `SSR warm-up: <path> -> <code> <time>` line per page, plus a `WARN` summary on failure. It never fails the deploy.
  - With SWR, the warmed copies keep serving for 30 minutes while traffic refreshes them.
- Not changed: MongoDB pool size, nginx, systemd, render timeout.

[E] Expected effect: no hub-page timeouts for crawlers once a page has rendered once since the restart. The first render after a restart still costs 4–22 s, and the warm-up takes that cost. The underlying API latency (4 s calls, enrichment fan-out) remains; see §6.

## 4. Tests and CI [V]

| Check | Result |
|---|---|
| Backend `npm test` (local) | 395 tests: 392 pass, 0 fail, 3 skip |
| Backend with `TEST_MONGO_URI` (scratch mongod) | 430 tests: 429 pass, 0 fail, 1 skip |
| New backend test | `getItem`: missing gives `NotFoundError` 404; database failure gives no 404 |
| `seo-ssr-resilience` new sections (local and CI) | 11-case legacy matrix (301 ×3, 404 ×6, 410, 503) plus the SWR cycle MISS → HIT (spoofed token) → STALE → HIT |
| Red check | the new suite fails against `main`'s `ssr-server.mjs` (`410 expected, got 404`) |
| `test:deploy` | pass; asserts the warm-up runs and does not warn when every page is 200 |
| `ssr-canonical.test.mjs` | 8/8 |
| CI `verify` (lint backend/frontend, backend tests with Mongo, `test:deploy`, Karma, production build) | pass |
| CI `ssr-resilience` (fresh SSR build, full script incl. 2D-0B and canonical checks) | pass |

**Not run locally:** `ng build --ssr`, Karma and a local crawl, because WSL had about 1.2 GB free. CI ran the build and Karma. A bounded crawl against a candidate was not run; the post-deploy production crawl is the check (§5).

## 5. Rollout and rollback [P]

1. Merge PR #35 (separate authorisation); `deploy.yml` deploys it.
2. Check the deploy log: 10 `SSR warm-up … -> 200` lines and no `WARN`.
3. Spot checks:
   - an expired `/contenido/program:*` id from `access.log` gives 404;
   - a current airing id gives 301 to its detail page;
   - `/contenido/tmdb:movie:155` gives 301;
   - a hub page more than 5 minutes after its last render shows `X-SSR-Cache: STALE`, then `HIT`.
4. Run the production crawl (6 workers, as before): target 0 503s.
5. After 24 h, compare the nginx 503 count against the 300–1,200/day baseline, and `TV read item not found` against "Operational error … NOT_FOUND".

Rollback: revert the merge, or repoint `/var/www/guiatv/current` to the previous release and restart both services. No data, index or configuration changes.

## 6. Remaining SEO risks

- Expired airing URLs now give 404, not 410. Google drops them a little more slowly, but reversibly; the 410 decision belongs to 2D-3.
- Hub renders still cost 4–22 s per miss. API latency (4 s calls, per-programme enrichment fan-out in SSR) is the next performance target, issue #27.
- A stale page can be up to 30 minutes old in the worst case, when every refresh fails. "En directo" content may then be out of date; the normal case is one stale response, then fresh.
- The SSR cache is per process and in memory, and a restart clears it; the warm-up covers that.
- 2D-2C open items are unchanged: reviewer normalisation, entity sample review before write mode.
