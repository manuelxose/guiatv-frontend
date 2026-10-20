# GuíaTV — Phase 2D-0: SSR canonical correction and SSR→API rate-limit safety (2026-10-20)

Branch `fix/seo-2d0-canonical-ratelimit` from `main` @ `68ed98a` (= production release `20261020175850`, confirmed from `/var/www/guiatv/current/release.json`). Commits `5cd5bf9`, `20cd5c3`, `d7a212a`, plus this report. **Not pushed, not merged, not deployed.** No database, collection, retention, entity or legacy-URL work (that is 2D-1 onwards). The untracked Phase 1 and 2C documents were left as they were.

"Before" = production. "After" = this branch's production SSR build on the Windows host (`%TEMP%\guiatv-2d0`, Node 24.18), run against the production API (`API_ORIGIN=https://guiaprogramaciontv.com`). WSL was used for backend tests and for the before-matrix.

## 1. Root causes

1. **SSR canonical override [verified].** `ssr-server.mjs` ran `injectCanonical(html, req.path)` on every rendered page, which replaced Angular's canonical with the request path. Every server-rendered page was self-canonical, whatever the component declared, while the browser DOM (after hydration) carried the component's value. Issue #17 is one instance of this.
2. **What the override was masking [verified].** Once it was removed, two components turned out to declare wrong canonicals:
   - **Catalogue detail** declared `item.detailPath`, rebuilt by the API from the *inferred* content type and title: `/programas/the-last-ship` → `/series/the-last-ship`, `/programas/friends-t3` → `/series/friends-t3`. Its JSON-LD `url` and last breadcrumb item did the same. Nothing guarantees those URLs resolve to the same item (2C §B.2).
   - **Channel page** declared `channelPath(channel.id)`: `/canales/discovery` → `/canales/dmax`, `/canales/factoria-de-ficcion` → `/canales/fdf`, `/canales/paramount-channel` → `/canales/paramount-network`. Both URLs serve the same channel, but the sitemap and links list the `normalizedName` one.
   - **Error and not-found states** declared canonicals (the request path on 404/503 pages; `/deportes/futbol/partidos-hoy` on a missing match; the hub on a missing team or competition).
3. **SSR→API rate limiting [mechanism verified; production 429 frequency not measured].** Angular's server `HttpClient` calls `http://127.0.0.1:4000` directly. Production sets no `API_ORIGIN`/`SSR_API_BASE_URL` (variable names in `/etc/guiatv/ssr.env` checked), and no interceptor forwards the visitor's address. With `trust proxy` 1 and no `X-Forwarded-For`, `req.ip` is the socket address, so every server render on the site was counted against the single `127.0.0.1` bucket of each per-IP limiter (`generalRateLimit` 100/min, `catalogRateLimit` 300/min, …). API logs were not read, so how often this produced 429s in production is unmeasured.

## 2. Changes

| File | Change |
|---|---|
| `apps/frontend/scripts/ssr-canonical.mjs` (new) | The canonical policy (`finalizeCanonical`): keep Angular's canonical; add a self-canonical **only** to an indexable 200 page that has none; add none to redirects or `noindex` pages; remove any from responses ≥ 400; never more than one tag (first kept); the request path is attribute-encoded. |
| `apps/frontend/scripts/ssr-server.mjs` | `injectCanonical` removed. The rendered path and the CSR fallback shell call `finalizeCanonical` after robots are set. `X-SSR-Canonical: fallback` marks a page whose canonical came from the fallback (none did in the matrix, §3). |
| `scripts/publish-release.mjs` | Ships `ssr-canonical.mjs` next to `ssr-server.mjs` (the release copied only the latter). Sandbox run: both files land in the release and the import resolves. |
| `services/meta.service.ts` | `canonicalUrl: null` removes the canonical (and oEmbed) link. `markUnavailable(title)` no longer takes or declares a canonical (5 callers updated). |
| `pages/catalog-detail/catalog-detail.component.ts` | Canonical, share URL, last breadcrumb item and JSON-LD `url` = the requested path (what Google sees today), not `item.detailPath`. Not-found/503 state: no canonical. The slug strategy is unchanged; the entity canonical replaces this in 2D-6. |
| `pages/canal-completo/*`, `config/route-map.ts` | `channelCanonicalPath(channel)` = `normalizedName` → `id` → requested slug; used for canonical and breadcrumb. Not-found state: no canonical. |
| Football match/team/competition, blog post/category, channel directory, guides home | Not-found and unavailable states: `canonicalUrl: null`. |
| `apps/backend/src/presentation/middlewares/rateLimit.ts` | `isDirectLocalRead(req)` and `skip` on every `createRateLimiter` limiter: GET/HEAD, TCP peer is loopback, and no `X-Forwarded-For`, `X-Real-IP` or `Forwarded` header. `aiRateLimit` (per user) is unchanged. |
| Tests | `ssr-canonical.test.mjs` (8), `rateLimit.test.ts` (4), MetaService spec (updated + 1), match-detail spec (+1, updated 1), route-map spec (+2), `seo-ssr-resilience.mjs` (+canonical assertions on 11 outage routes, widget, static pages, query strings, 404). |

## 3. Canonical matrix

Raw = canonical in the server HTML; DOM = after JS, in Chromium (`locale es-ES`, `Europe/Madrid`); LD = JSON-LD `url`. Raw data: `docs/seo/phase-2d0/canonical-matrix-*.json`, script `canonical-matrix.mjs`.

| Page | Status | Before raw | Before DOM / LD | After raw = DOM | After LD |
|---|---|---|---|---|---|
| `/` and `/?utm_source=test` | 200 | `/` | `/` | `/` | — |
| `/canales/la-1` and `?dia=manana` | 200 | `/canales/la-1` | same | `/canales/la-1` | — |
| `/programas/the-last-ship` | 200 | self | **`/series/the-last-ship`** / LD `/series/…` | `/programas/the-last-ship` | same |
| `/programas/friends-t3` | 200 | self | **`/series/friends-t3`** / LD `/series/…` | `/programas/friends-t3` | same |
| `/programas/espejo-pblico` | 200 | self | self | self | — |
| `/series/friends`, `/series/la-promesa` (noindex) | 200 | self | self | self | self |
| `/peliculas/elvis`, `/peliculas/2` (noindex) | 200 | self | self | self | self |
| `/guias/precios-plataformas-streaming-espana` | 200 | self | self | self | — |
| `/deportes/futbol`, `/deportes/futbol/partidos-hoy` | 200 | self | self | self | — |
| Match, current slug `…-2026-10-18` | 200 | self | self | self | self |
| **Match, legacy slug `…-2026-10-17` (#17)** | 200 | **`…-10-17`** | **`…-10-18`** / LD `…-10-18` | **`…-10-18`** | `…-10-18` |
| Missing match `equipo-a-equipo-b-2026-01-01` (noindex) | 200 | self | **`/deportes/futbol/partidos-hoy`** | none | — |
| `/programacion-tv/guia-canales` | 301 | — | — | — | — |
| `/contenido/program:…` (expired airing) | 503 | self | — | none | — |
| `/iniciar-sesion` (noindex) | 200 | self | self | none | — |
| `/tendencias` | 200 | self | self | self | — |
| `/no-existe-2d0`, `/programas/no-existe-2d0` | 404 | self | — | none | — |
| `/embed/programacion` (noindex CSR widget) | 200 | self | self | raw none, DOM self | — |
| `/embed`, `/avisolegal` | 200 | self | self | self | — |
| Crawl only: `/canales/dmax` (alias) | 200 | self | `/canales/dmax`* | **`/canales/discovery`** | — |
| Crawl only: `/canales/discovery`, `/factoria-de-ficcion`, `/paramount-channel` | 200 | self | `dmax`, `fdf`, `paramount-network`* | self | — |

\* From the first candidate crawl, before the channel fix.

**Inconsistencies before: 4 in the matrix** (two programme pages, the legacy match, the missing match) **plus 3 channel pages** in the crawl, and canonicals on every error page. **After: 0 conflicting values.** The only raw ≠ DOM case left is the `noindex` widget: the raw HTML has no canonical and the client sets its own path. There are not two different values, and the page is `noindex` and framed.

No indexable template used the fallback (`X-SSR-Canonical` was absent on every 200 page in the matrix), so every indexable template declares its own canonical.

## 4. Rate limit: hypothesis confirmed (mechanism); security analysis

**Evidence.**
- The SSR → API path was traced through the code (`app.config.server.ts`, `api-config.service.ts`, the interceptors) and the production SSR environment (variable names only).
- Production nginx (`/etc/nginx/sites-enabled/guiatv.conf`) is byte-identical to `infra/nginx/guiatv.conf`. Every location that proxies to the API sets `X-Real-IP` and `X-Forwarded-For $proxy_add_x_forwarded_for`, including the `guiatv_proxy.conf` snippet.
- The API and SSR listen on `*:4000` and `*:3000`, not on loopback as `RUNBOOK.md` says. ufw (default deny) allows only 22/80/443, and external connections to 3000/4000 fail.

**Design.** The exemption keys on the TCP peer address, which a remote client can't forge. It also requires that no forwarding header be present, and a client can't strip the forwarding headers nginx adds. A forwarding header never grants the exemption, even one that claims `127.0.0.1`. Only GET/HEAD are exempt, so logins, telemetry and admin writes stay limited. The general limit was not raised.

**Trust assumptions (documented in the code).**
- All public traffic goes through nginx.
- Ports 3000/4000 stay firewalled.
- Processes on this host are trusted. The box also runs other sites (`talkaris`, `tecnoria`, `electroria`, `content-ai-platform`); a local process making GET requests to `127.0.0.1:4000` is not rate-limited.

**Tests.** `rateLimit.test.ts` runs a real express app with production `trust proxy` 1:
- nginx-style requests (with `X-Forwarded-For`) get 200, 200, 429;
- direct local GETs get six 200s;
- spoofed `X-Forwarded-For: 127.0.0.1`, an empty XFF, `X-Real-IP` and `Forwarded` all still reach 429;
- local POSTs reach 429.

**Found, not changed (outside 2D-0, needs a decision).**
1. **Per-client limiting of public traffic is effectively keyed on Cloudflare edge addresses.** nginx has no `real_ip` configuration, so `$remote_addr` is a Cloudflare edge address, and `trust proxy` 1 makes `req.ip` that edge address. Three consecutive public requests from one machine each reported `ratelimit-remaining: 299`, i.e. a fresh bucket each time. The fix is nginx `set_real_ip_from <Cloudflare ranges>` + `real_ip_header CF-Connecting-IP`, trusted only from those ranges. It is an infra change and should ship separately.
2. `RUNBOOK.md` says the services bind to `127.0.0.1`; they bind to all interfaces. Binding to loopback would add defence in depth. The exemption doesn't depend on it.

## 5. Tests and results

| Check | Result |
|---|---|
| Backend `npm test` (WSL) | 364 pass, 0 fail, 1 skip (Redis, environmental); 2B: 360/0/1. +4 = the new `rateLimit` tests |
| Backend lint (`tsc --noEmit`, run by the test build) | pass |
| Frontend Karma (Windows) | **270/270** (2B: 266) |
| Frontend ESLint, changed files | 0 errors (existing `prefer-inject`/`any` warnings) |
| `tsc` app + spec configs | pass |
| SSR production build (Windows) | OK |
| `node --test apps/frontend/scripts/ssr-canonical.test.mjs` | 8/8 |
| `npm run seo:ssr-resilience` | 26/26 ok: 11 outage routes 503/no-store/noindex/**no canonical**, 8 single-hop 301s, widget 200/noindex/`frame-ancestors *`/no XFO/no server canonical, SAMEORIGIN elsewhere, `/tendencias` noindex without data, `/avisolegal` (± query) and `/sobre-nosotros` one self-canonical, 404 no canonical |
| `seo:crawl` candidate | 305 sitemap URLs, 294/294 200s with a canonical, **14 issues**, all on the 14 `sitemap-programs.xml` URLs that already 404 in production (2C §G.2). Its probes: `/canales/dmax` → `/canales/discovery`, legacy match → `…-10-18` |
| `seo:crawl` production (baseline, same time) | 305 URLs, the same 14 URLs with the same issues. The candidate adds "no canonical" on them, which is intended |
| Responsive Playwright vs candidate (2 workers) | **182 passed, 1 failed**: the widget slot-navigation test, known issue #22 (fails 18:00–21:00 Madrid; run at 19:14) |
| `npm run test:deploy` | passed |
| `publish-release.mjs` sandbox run | both scripts in the release; `ssr-canonical.mjs` imports |

## 6. Regressions and differences from production

- **Intended:** canonical removed from 404/410/503 responses and from noindex not-found states. Google doesn't render JavaScript on non-200 responses and doesn't use a canonical on them; `noindex` + a canonical to another URL is a mixed signal.
- **Intended:** `/canales/dmax`-style aliases now declare the sitemap URL.
- **Intended:** programme pages' DOM canonical and JSON-LD now equal the served URL (they pointed at `/series/…`).
- The football legacy slug now consolidates by canonical only. The 301 is a separate step (2C §K, 2D-7).
- No other canonical, robots, status or header difference was found in the matrix, the crawl or the resilience run.

## 7. Remaining issues

- 14 sitemap programme URLs 404 in production (2C §G.2); fixed by the entity work, not here.
- Duplicate catalogue URLs stay self-canonical (`/programas/x` vs `/series/x`, season suffixes, accent-dropped slugs) until the entity registry exists (2D-2…2D-7). This phase deliberately didn't change the slug strategy.
- Channel alias URLs still answer 200 (now canonicalised). Internal links still use the id form (`tv-normalizers.ts` `channelPath(item.channel.id)`), so they point at the non-canonical alias. That is internal-link work (2D-9) or a 301 for aliases.
- Cloudflare-edge keying of public rate limits (§4).
- Issue #22 (test), #17's redirect and NOT_FOUND-under-throttling parts (2C §K).

## 8. Deployment and rollback

**Deploy** (after review): merge to `main` triggers `deploy.yml` (backend and frontend in one release). nginx caches SSR 200s for 5 minutes, so the old HTML can be served for up to 5 minutes.

**Verify on production:**
1. `node docs/seo/phase-2d0/canonical-matrix.mjs https://guiaprogramaciontv.com out.json` (from the repo root, with Playwright installed): every row consistent except the widget note. The legacy match row shows `…-10-18`; `/canales/dmax` shows `/canales/discovery`.
2. `npm run seo:crawl`: the same 14 known URLs only.
3. `curl -s https://guiaprogramaciontv.com/no-existe | grep -c 'rel="canonical"'` → 0.
4. Rate limit: public requests still return `ratelimit-*` headers and 429 under burst. Check the API log for 429s from `127.0.0.1` during the next Search Console crawl spike; expect none.

**Rollback:** repoint `/var/www/guiatv/current` to `releases/20261020175850` and restart `guiatv-api` and `guiatv-ssr` (RUNBOOK "Rollback"), or revert the merge commit. Neither the database nor the configuration changed, so the rollback is complete.

## 9. Skills

- **Invoked:** `seo-technical` (canonical/robots/redirect checklist and the JavaScript-canonical guidance, which says raw-HTML and JS canonicals must match and that non-200 pages are not rendered).
- **Read for their canonical sections only:** `seo-page`, `seo-schema`, `mk-seo-audit`.
- No dependency added.

**STOP.** 2D-0 is implemented and validated on the branch. Review needed before merge; 2D-1 not started.
