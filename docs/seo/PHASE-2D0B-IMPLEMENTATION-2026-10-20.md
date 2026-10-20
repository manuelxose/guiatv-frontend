# Phase 2D-0B: internal SSR API routing

Branch `fix/ssr-internal-api-routing`, based on `main` at `aa46e40` (PR #24). Production was verified on that revision before work began: `release.json` `gitSha` = `aa46e40…`, release `20261020200327`. Nothing has been deployed from this branch.

## 1. Root cause

Angular's server `HttpClient` resolves a relative URL against the incoming request. In production the request is `https://guiaprogramaciontv.com/...` (nginx forwards `Host` and `X-Forwarded-Proto`), so a server-side call to `/v2/x` became `https://guiaprogramaciontv.com/v2/x`. That URL leaves the VPS through public DNS and comes back through Cloudflare and nginx to the API. The interceptor responsible is `relativeUrlsTransformerInterceptorFn` in `@angular/platform-server`.

The 2D-0 report said SSR called `http://127.0.0.1:4000` directly. That holds only for the services built on `ApiConfigService` (discovery, blog, content, channel page). About 20 other services use `environment.API_BASE_URL` (`/v2`) directly, so their SSR calls went through Cloudflare. Examples are catalog, streaming providers, affiliate, monetization and football.

Side effects of the old setup:
- `ApiConfigService` gave the server an absolute internal base. As a result, `getAssetBaseUrl()` leaked the API origin into the HTML. Production `/canales/la-1` served `<img src="http://127.0.0.1:4000/storage/channel_icons/la_1.webp">`, a broken image for both visitors and crawlers.
- The resolved host came from the `Host` header. A request through the SSR port with `Host: localhost:9999` made SSR fetch `http://localhost:9999/v2/...`, so the client chose the port. Through nginx and Cloudflare only the real hostname arrives, so this was a defence-in-depth gap, not something reachable from outside.

## 2. Baseline (production, before)

Source: `guiatv-api` request logs (`ip`, `userAgent`, `method`, `statusCode`, `durationMs`), 2026-10-20 16:10–18:10 UTC. The aggregation script is `phase-2d0b/ssr-api-traffic.py` and its output `phase-2d0b/ssr-api-traffic-before-production.json`. Only aggregates were exported: no URLs, IPs, user agents or payloads. SSR traffic is identified by user agent `node`. Internal means the TCP peer was loopback.

| SSR API calls (17,319) | Share | Status | Backend time p50 / p90 / p99 (ms) |
|---|---|---|---|
| via Cloudflare, GET/HEAD | **79.9%** (13,831) | 13,210 ok, 619 404, 2 5xx | 4.3 / 100 / 442 |
| via Cloudflare, POST | **15.0%** (2,600) | 2,594 ok, 6 429 | 25 / 65 / 209 |
| internal, GET/HEAD | 5.0% (874) | 803 ok, 4 404, 67 5xx | 28 / 583 / 10,188 |
| internal, POST | 0.1% (14) | ok | 44 / 76 / 80 |

- **95% of SSR API calls went through Cloudflare.** The POSTs are all `POST /v2/affiliate/resolve`.
- **Round-trip cost, measured from the VPS** (30 × `GET /v2/catalog/platforms`, a new connection each time): public origin p50 98 ms, p90 136 ms. Loopback p50 2.3 ms, p90 2.6 ms. The backend time in the table above doesn't include this hop. Node's fetch reuses connections, so the real per-call overhead is lower than 98 ms. It wasn't measured inside SSR.
- **SSR render timeouts** (20 s, answered as 503): 6 in the window.
- **SSR render duration** isn't logged anywhere, so it's unmeasured. I didn't add instrumentation.
- **Rate-limit errors** on SSR calls: 6 × 429, all on POST via Cloudflare.

## 3. Change

| File | Change |
|---|---|
| `apps/frontend/src/app/api/internal-api.backend.ts` (new) | `InternalApiBackend extends FetchBackend`, provided only in `app.config.server.ts`. It sees each request after all interceptors, so the URL is already resolved. A request is rewritten to `${SSR_API_BASE_URL \|\| API_ORIGIN \|\| http://127.0.0.1:4000}${path}${query}` only when the method is GET or HEAD, the scheme is http(s), there's no userinfo, the hostname is one of the SSR server's accepted hosts, and the path is `/v2` or under `/v2/`. Everything else passes through unchanged: third-party APIs, other hosts, non-API paths, writes. |
| `apps/frontend/src/app/app.config.server.ts` | Provides `HttpBackend → InternalApiBackend`. Removes `HTTP_TRANSFER_CACHE_ORIGIN_MAP`, which no longer has anything to map. |
| `apps/frontend/src/app/api/api-config.service.ts` | The base is relative `/v2` on both platforms, so server and browser issue identical URLs. This fixes the asset-URL leak and removes the server-only `process.env` code from the browser bundle. |
| `scripts/seo-ssr-resilience.mjs` | Spawn and stop helpers. New section with a fake API (§5). |
| `docs/seo/phase-2d0b/` | Traffic script, hydration-refetch script, before/after evidence. |

**Why a backend, not an interceptor:** the transfer-cache key is computed from the URL before Angular's relative-URL transform runs. Rewriting at the backend therefore leaves keys equal to the browser's relative URLs. An interceptor would have to sit at a precise position in Angular's root interceptor chain. Subclassing `FetchBackend` also keeps Angular's "use fetch on the server" check satisfied.

**Why POST stays public:** loopback GET/HEAD are exempt from per-IP limits (`isDirectLocalRead`), but loopback writes are not. SSR peaks at about 220 `POST /v2/affiliate/resolve` per minute (nginx log, 13:23). Routed internally, those would share one `127.0.0.1` bucket against the 100/min `generalRateLimit` and get 429s. Exempting them would broaden the exemption, which this phase rules out. This is marked `ponytail:` in the code; the upgrade path is a dedicated SSR credential (§4).

**Expected after deploy:** about 85% of SSR API calls internal, and the roughly 15% that are affiliate POSTs still on Cloudflare. This is a projection from the baseline mix, not a measurement.

## 4. Security assessment

- **Exemption not broadened.** `rateLimit.ts` is unchanged. SSR reads now qualify for the existing GET/HEAD loopback exemption, which is what 2D-0 built it for. Public traffic always arrives through nginx with `X-Forwarded-For`, so it never qualifies, and public limits are unchanged.
- **No auth bypass.** The only backend logic keyed on a loopback peer is that rate-limit skip; authentication and authorization don't look at the source IP. SSR sends no visitor credentials: there's no `REQUEST` cookie forwarding, and the auth interceptor returns early on the server. The suite checks this end to end by sending the visitor's `Cookie` and `Authorization` and asserting the API receives neither.
- **No SSRF primitive.** The target origin is fixed configuration. The client-supplied host and port are dropped, the path must be the parser-normalised `/v2/...` (`/v2/../admin` and `%2e%2e` don't qualify), and writes, other hosts and non-API paths are untouched. A spoofed `Host: localhost:9999` now reaches only the configured API.
- **No secrets in the browser bundle.** `SSR_API_BASE_URL` and `API_ORIGIN` no longer appear in `dist/browser`; before this change, one chunk referenced them. Two hard-coded `http://127.0.0.1:4000` fallbacks remain on server-only branches of `chat.service` and `auth-refresh.interceptor`. They're defaults, not configuration or secrets.
- **Dedicated SSR credential: not needed for this change.** SSR makes no authenticated calls. A credential becomes worthwhile to (a) route the affiliate POSTs internally under their own quota, and (b) limit the exemption to `guiatv-ssr` instead of every process on the host.
- **Residual cross-application risk (unchanged from 2D-0).** Other services on the VPS (`talkaris`, `tecnoria`, `electroria`, `content-ai-platform`) can make unlimited GET/HEAD requests to `127.0.0.1:4000`. That is an availability risk, not a data risk. The API and SSR bind to `*:4000` and `*:3000`, protected only by ufw. nginx and Cloudflare trust settings were not touched.

## 5. Error handling

Status codes are unchanged: pages map any API error to 503 + noindex (`MetaService.markUnavailable`) and only "no data" to 404. What changes is the source of errors: Cloudflare-originated 5xx and 429 errors go away, and a refused connection is now a status-0 network error rather than a 502 from SSR's own proxy. The suite checks that both still produce 503. API 429 and API 500 both give 503 + noindex, never 404. Timeouts (the SSR 20 s render timeout) and invalid payloads keep their current behaviour and weren't tested separately.

## 6. Tests and results

| Check | Result |
|---|---|
| Backend `npm test` (WSL) | 365 pass, 0 fail, 1 skip (Redis). Includes the `rateLimit` tests: public limits and exemption rules |
| Frontend Karma (Windows) | **274/274** (+4: `internal-api.backend.spec.ts`) |
| `tsc` app + spec, ESLint changed files | pass; 0 errors (existing `any` warnings in `app.config.ts`) |
| SSR production build (Windows) | OK |
| `seo:ssr-resilience` | **36/36** (26 existing + 10 new). On the `main` build the new section fails: `/guias` sent 1 of 4 API calls to `API_ORIGIN` and `/peliculas/el-caballero-oscuro` sent 0. On the branch: 4/4 and 1/1, for both `Host: guiaprogramaciontv.com` and `Host: localhost:9999`. All 12 recorded requests were under `/v2` on `API_ORIGIN`, with no cookie, `Authorization` or `X-Forwarded-For`. API 429 and 500 both gave 503 |
| Canonical matrix, before vs after (local builds, production API) | **0 of 26 rows differ** (status, canonical raw and DOM, robots, `X-Robots-Tag`, JSON-LD). Only inconsistent row: `/embed/programacion`, as in 2D-0 |
| Hydration refetch (`hydration-refetch.mjs`, 9 pages) | **Identical before and after**: no new duplicate requests (§7) |
| Channel logo in SSR HTML | before: API origin + `/storage/...`; after: `/storage/channel_icons/la_1.webp` |
| `seo:crawl` candidate | 938 URLs. First pass: 703 × 200 and 235 × 503. The 503s came from production rate-limiting the candidate, which ran on Windows calling the production API from one IP (9 × 429 logged), and none became a 404. Re-fetching those 235 at 1.5 s intervals: all 200 with a self-canonical |
| `seo:crawl` production (same time) | 938 URLs, 1 issue: `/canales` returned 503 once, a render timeout; 200 on recheck |
| Responsive Playwright vs candidate (2 workers) | **183/183 passed** |
| `npm run test:deploy` | passed. The release is unchanged: the new file is part of the Angular bundle |

## 7. Found, not changed

1. **The HTTP transfer cache stores nothing in production.** `ng-state` on `/peliculas/elvis` holds only `deviceInfo` and hydration data, with no HTTP entries. The browser repeats SSR's API calls on every page view: 8 affiliate POSTs on `/`, and 5 calls including the main `catalog/slug` on `/peliculas/elvis`. Behaviour is the same before and after this change. Fixing it would roughly halve API calls per page view. The cause needs its own diagnosis.
2. **`ssr-server.mjs` legacy-catalog lookup:** `GET /v2/catalog/:catalogId` from SSR returns 500 several times a minute. These are the 67 internal 5xx in the baseline, with p99 10 s.
3. **SSR render timeouts:** 6–7 per 30 min–2 h, answered as 503. They make crawl results flaky (`/canales` above).
4. Public per-IP limits are keyed on Cloudflare edge addresses (2D-0 §4, nginx `real_ip`). Still open.

## 8. Deploy, verification and rollback

**Deploy** (after review): merge to `main` triggers `deploy.yml`. No environment change is needed: production sets neither `API_ORIGIN` nor `SSR_API_BASE_URL`, so the default `http://127.0.0.1:4000` applies.

**Verify:**
1. `curl -s https://guiaprogramaciontv.com/canales/la-1 | grep -c 127.0.0.1` returns 0, once nginx's 5-minute SSR cache has expired.
2. After at least 2 hours of traffic, on the VPS: `journalctl -u guiatv-api --since "-2h" -o cat | python3 ssr-api-traffic.py`. Expect SSR `public/read` near 0% and `internal/read` around 85%. Also check 429 and 5xx counts and render timeouts (`journalctl -u guiatv-ssr | grep -c "SSR render timeout"`) against the baseline.
3. nginx: the count of `"node"` user-agent GETs on `/v2` drops to near zero; affiliate POSTs remain.

**Rollback:** revert the merge commit on `main` and push; `deploy.yml` redeploys. For a faster manual rollback, repoint `/var/www/guiatv/current` to the previous release (`20261020200327`, `aa46e40`) and `systemctl restart guiatv-ssr`. The backend is unchanged, so `guiatv-api` doesn't need a restart. `RUNBOOK.md` §Rollback describes the full rebuild path.

## 9. Deployment and production validation (2026-10-20)

PR #25 merged as `5c97b01` (merge commit, no bypass). Branch CI on `781c20a`: `verify` and `ssr-resilience` passed; `live-crawl` skipped. CI on `main` passed too. `deploy.yml` deployed release `20261020210703` (`release.json` `gitSha` = `5c97b01…`) at about 19:07 UTC, and both `guiatv-ssr` and `guiatv-api` are active. Pre-merge review found nothing new. Unknown hosts are rejected before render (`ssr-server.mjs` `SSR_ALLOWED_HOST_SET`), the target origin is fixed, and only GET/HEAD to `/v2` on a site host are rewritten. The backend is server-only, and the browser base is still `/v2`.

**Production checks** (after nginx's 5-minute cache had expired, 19:13 UTC onward):

| Check | Result |
|---|---|
| `seo:crawl` | 937/937, 0 issues |
| Canonical matrix (`phase-2d0/canonical-matrix.mjs`) | 26 rows. Only `/embed/programacion` is inconsistent, as before |
| Responsive Playwright (2 workers) | 183/183, including the 3 cross-origin widget iframe tests |
| Internal URLs in HTML (8 templates) | 0 × `127.0.0.1`, `:4000`, `localhost`. Channel logo is `/storage/channel_icons/la_1.webp` |
| Browser bundles (92 chunks) | No `SSR_API_BASE_URL` or `API_ORIGIN`. Only the two known server-branch fallback literals (§4) |
| Rate-limit smoke (5 spaced GETs) | `ratelimit-limit: 300` on public requests. `remaining` stays at 299 across requests, which is the open edge-IP keying issue (#28) |

**Traffic** (`ssr-api-traffic.py`, SSR = UA `node`). Both windows are 2 h. "Before" is the 2 h immediately before deploy on the old release. Backend time is the API's own handling time and doesn't include the network hop.

| SSR API calls | Before 17:06–19:05 UTC | After 19:08–21:08 UTC |
|---|---|---|
| Total | 24,227 | 7,277 |
| Internal GET/HEAD | 937 (3.9%) | **6,256 (86.0%)** |
| Via Cloudflare GET/HEAD | 19,772 (81.6%) | **0** |
| Affiliate POST (Cloudflare) | 3,504 (14.5%) | 1,021 (14.0%) |
| 429 | 561 (501 read, 60 POST) | **0** |
| 5xx | 66 (63 internal legacy lookup) | 45 (all internal legacy lookup, #30) |
| SSR render timeouts | 11 | **0** |
| Backend p50/p90/p99, reads (ms) | via CF 3.3/64/349; internal 34/457/8,931 | internal 5.6/123/6,805 |
| Backend p50/p90/p99, POST (ms) | 23/59/174 | 26/78/318 |

nginx since deploy: 0 `node` GETs on `/v2`, 1,030 `node` affiliate POSTs.

- **The distribution matches the projection** (§3: about 85% internal, about 15% affiliate POSTs on Cloudflare).
- **Total volume fell 70%. This is load, not routing.** Page requests fell 42% (4,702 → 2,715, evening in Madrid), and the "before" window includes a burst of about 3,700 SSR calls at 18:43–18:45 UTC. The affiliate POSTs, which this change doesn't touch, fell in the same proportion as the reads (reads per POST: 5.9 → 6.1). Yesterday's same-time window (`ssr-api-traffic-before-sametime-production.json`, old routing) had 3,391 SSR calls, so day-to-day volume isn't a usable baseline. It still shows the same about 83% via Cloudflare.
- **All 501 SSR read 429s fell in the burst**, keyed on Cloudflare edge IPs. This is the hairpin failure this change removes: the burst produced 0 429s on the internal route.
- **404s are unchanged in kind and in absolute numbers** (318 → 274; nginx page 404s 316 → 260): unknown `catalog/slug/program/*`. Their share rose only because total volume fell.
- **Page 503s** (79 → 45) are almost all `/contenido/*`, the legacy catalogue lookup (#30), in both windows.

**Backlog:** #26 transfer cache, #27 SSR timeouts, #28 Cloudflare real-IP trust, #29 SSR service credential, #30 legacy catalogue 500s.

**Rollback readiness:** the previous release `20261020200327` (`aa46e40`) is still in `/var/www/guiatv/releases/`. Repoint `current` and `systemctl restart guiatv-ssr`, or revert `5c97b01` on `main`.
