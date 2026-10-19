# 01 — Technical audit (2026-10-19)

Evidence: live crawl of all 453 sitemap URLs + 13 probes (`artifacts/seo/crawl-2026-10-19.json`, `scripts/seo-crawl.mjs`), template survey of 21 URLs, 50 editorial post payloads (`artifacts/seo/blog-*.json`), local SSR reproductions, source reading. Labels: **[Observed]** measured on production or locally this session · **[Hypothesis]** not proven · **[Fix]** implemented in the working tree (**not committed, not deployed**).

## Architecture discovered
- Monorepo `guiatv-frontend` (npm workspaces): `apps/frontend` Angular **20.3.29** with SSR, `apps/backend` Express + MongoDB + Valkey. Auctorio is a separate repo (`/workspace/auctorio`, Fastify/Prisma/BullMQ) that pushes drafts to `POST /v2/blog`.
- Rendering: custom Express wrapper [apps/frontend/scripts/ssr-server.mjs](../../apps/frontend/scripts/ssr-server.mjs) around `AngularNodeAppEngine`; **0 prerendered routes**; every public route is SSR'd on demand. Initial HTML contains the content (verified: `<main>` text, h1, JSON-LD present before JS) — the "empty SPA shell" risk does **not** apply to healthy renders.
- Status codes are signalled by a `<meta name="ssr-status">` that components set through `MetaService`; the wrapper converts it to the HTTP status, injects canonical/robots and `X-Robots-Tag`.
- Cache layers (all 5 min): in-process Map (key = path, query ignored) → nginx `proxy_cache guiatv_ssr` (`infra/nginx/guiatv.conf`) → Cloudflare (`cf-cache-status: DYNAMIC`, i.e. not cached by CF). API: nginx `guiatv_api` cache with stale-on-error; backend rate limits 100 req/min (general), 240–300 (catalog/discovery).
- SEO surface: `robots.txt` static; `sitemap.xml` index → static (24), channels (80), programs (286 TMDB-resolved movie/series pages), blog (63: 50 posts + 13 categories). `ads.txt` 200 `text/plain`. Legacy `/detalles|/pelicula-details|/program-full-details|/contenido` redirect to canonical slugs (301) or 404.
- Deploy: GitHub Actions → SSH → `deploy-guiatv.sh` → release dir + symlink; production runs the same bundle hash (`main-OVZGJXNY.js`) as this checkout.

## What is healthy [Observed]
- 453/453 sitemap URLs fetched; 451 returned 200 (2 × 404, see T1/T7) and 432 of them were healthy renders (19 were error shells, T1) with a self-canonical, `index` robots, `lang="es"`, one `<h1>`, valid JSON-LD (Movie 124, TVSeries 143, Article 50, FAQPage 14, BreadcrumbList). No duplicate sitemap URLs, no non-canonical hosts, HTTP→HTTPS and www→apex redirects correct (Aug audit; unchanged).
- Private routes (`/admin`, `/iniciar-sesion`) 200 + `noindex, follow` + `X-Robots-Tag`; unknown channel/program/movie URLs return a real 404 + `noindex, nofollow`; `/pelicula-details/155` → 301 canonical.
- TTFB from this machine 0.16–0.40 s; home 61 KB on the wire (865 KB raw, 616 KB of it Angular transfer state).

## Findings

### T1 — P0 — SSR turns a failed data load into a cacheable, indexable 200 (or a false 404)
- **Evidence [Observed]:** in the crawl, `/canales`, `/editorial/mejores-series-max`, `/editorial/mejores-series-disney-plus` and 11 `/editorial/categoria/*` pages returned **200**, cacheable (`s-maxage=300`), with body text "No pudimos cargar los canales" / "El artículo no está disponible ahora mismo", `<title>Blog - Guía TV</title>`, and the *homepage's* default description / `og:title` / `og:url`. They were still failing 30+ minutes later (several cache TTLs), while `/editorial` and `/editorial/mejores-series-netflix` rendered fine. Five static URLs (`/plataformas`, `/deportes/futbol`, `/deportes/futbol/partidos-hoy`, `/programacion-tv/series`, `/canales/tv_canaria`) showed the same 10-word error shell during the crawl and recovered on re-fetch; `/programas/fallen-t1-e6` returned a transient 404 under crawl load.
- **Reproduced locally [Observed]:** same bundle with `API_ORIGIN` pointing at a dead port ⇒ 200 + `public, s-maxage=300` + error text + no robots meta, for `/canales`, posts, categories, `/editorial`.
- **Root cause (code):** (a) `post-detail`, `category`, `blog-home`, `channel-catalog` render an error state but never set an HTTP status; (b) `ssr-server.mjs` cached every status < 500 and sent `public, s-maxage=300` even for errors; (c) `CatalogService.getBySlug/getDetail` collapse *any* HTTP error (429, 5xx, timeout) into `null`, and `catalog-detail` maps `null` ⇒ `httpStatus: 404`, so a backend hiccup is served as "page does not exist"; (d) `channel-catalog` set no metadata at all.
- **Root cause of the trigger in production [Hypothesis, not proven]:** the same bundle works against the production API from this machine, so something specific to the production SSR→API hop fails for those routes. Candidates: backend general limiter (100/min, one bucket for all SSR calls from 127.0.0.1; `/v2/blog` and `/v2/tv/read/channels` are on it), SSR timeouts on the 2.3 MB `/v2/tv/read/channels?date=today` payload, or an SSR env override. **Needs `journalctl -u guiatv-ssr` and `/var/log/nginx` on the server — I have no access.**
- **SEO impact:** Googlebot sees 200 pages with no content/meta duplicated from the home, or 404s for valid products; both can drop URLs from the index and are consistent with an indexing-loss pattern. Magnitude unknown without GSC.
- **[Fix]:** `MetaService.markUnavailable()` ⇒ components emit `ssr-status 503` + `noindex, nofollow`; `ssr-server.mjs` answers 5xx with `Cache-Control: no-store` + `Retry-After: 120` and never caches it; catalog detail distinguishes 404/410 from failures (`getDetailState/getBySlugState`); `channel-catalog` now has title/description/canonical.
- **Files:** `apps/frontend/scripts/ssr-server.mjs`, `services/meta.service.ts`, `services/catalog.service.ts`, `pages/{catalog-detail,channel-catalog,canal-completo}`, `blog/pages/{post-detail,category,blog-home}`.
- **Validation:** `npm run seo:ssr-resilience` (7 routes ⇒ 503/no-store/noindex: **passed**); live-API local run still 200 for good pages and 404 for unknown ones; post-deploy: `npm run seo:crawl` must show 0 issues, and watch `x-ssr-cache` + SSR logs for the real trigger.

### T2 — P1 — Unknown editorial URLs 302 to `/editorial` (soft 404)
- **Evidence [Observed]:** `/editorial/post-que-no-existe-xyz` and `/editorial/categoria/no-existe-xyz` → 302 → `/editorial`.
- **Fix:** both pages now render a not-found state with `httpStatus 404` + `noindex`. Verified locally: 404.
- **Files:** `blog/pages/post-detail/*`, `blog/pages/category/*`.

### T3 — P1 — Home page title/description do not target the page's purpose
- **Evidence [Observed]:** `<title>Inicio | Guía TV</title>` (16 chars) and description "Portal unificado… capas editoriales…" on the highest-authority URL; `og:title` differs from `<title>`.
- **Fix:** title "Programación TV hoy: qué ver en televisión y streaming | Guía TV" (64 ch), description ≤160 ch. File: `pages/home/home.component.ts`. Whether this moves rankings is untested.

### T4 — P1 — Meta descriptions up to 500 chars on programme/movie/series pages
- **Evidence [Observed]:** 238/286 programme pages > 170 chars (median 262, max 500) because the TMDB synopsis is used verbatim; `/peliculas/el-caballero-oscuro` 366.
- **Fix:** `MetaService.clamp()` cuts at a word boundary (160) for every page; detail titles clamp the item name at 55. Spec added.

### T5 — P1 — Raw Markdown rendered in 17 published posts
- **Evidence [Observed]:** `**Movistar Plus+**` and `<p>### Título</p>` visible in rendered HTML (19 `**` hits on one article); 3 excerpts too.
- **Fix:** render-time repair (`blog/utils/markdown-leftovers.ts`, spec) + the approval gate now rejects leftover Markdown (see 06). The stored data is unchanged.

### T6 — P2 — Duplicate / one-item BreadcrumbList JSON-LD
- **Evidence [Observed]:** detail pages emit two BreadcrumbList blocks (page-level + component); channel pages emit a one-item "Inicio" list plus the real one.
- **Fix:** `BreadcrumbComponent` skips trails < 2 items and has `[emitSchema]`; catalog detail passes `false`. Blog post pages still emit two (page + portal shell) — not changed.

### T7 — P2 — `/programas/deportes` in the programme sitemap returns 404
- 1 of 286. A one-word generic title passes the sitemap query but not the slug resolver. **Not fixed**; add the resolver's rule to `getIndexableProgramSitemapRows` or drop single-token generic titles.

### T8 — P2 — Category pages listed in the sitemap are listings with ~125 words
- 13 URLs. Either enrich (intro + curated picks) or `noindex, follow` and remove from the sitemap. Decision for the editor; see 03.

### T9 — P2 — Page weight
- Home 865 KB raw HTML / 616 KB `ng-state` (guide 507/239, article 295/145). Wire size is small (gzip/br) but parse cost and TransferState duplication matter for INP/LCP; prior Lighthouse (docs/performance-rebuild-final.md, Aug 22) had home LCP 5.3 s mobile. I could not re-measure (PageSpeed API 429, no local Lighthouse). Recommend trimming the home state payload (only what hydration needs).

### T10 — P2 — robots.txt blocks the legacy redirect routes
- `Disallow: /detalles/ /pelicula-details/ /program-full-details/ /contenido/` prevents Google from following the 301s that would consolidate old backlinks. Removing the Disallow lines (the routes already redirect or 404) is safe; `Disallow: /v2/` is *not* recommended until all content is confirmed server-rendered.

### T11 — P1 (trust) — Legal notice contains a drafting note and mixed identity
- **Evidence [Observed]:** `/avisolegal` publicly says "Cuando proceda, los datos registrales deben completarse antes de solicitar la revisión de AdSense." and describes the site as operated under the trade name TecnoRia, while `/sobre-nosotros` names TecnoRia S.L. **Owner action** (legal text is not mine to rewrite): decide the legal entity, remove the internal note.

### T12 — P3
- `/deportes/futbol/partidos-hoy` 101 words and 43-char description; `/deportes/futbol/en-directo` 68 words — dynamic lists, acceptable if populated; thin when no matches.

## Not verified
Google's rendered view (URL Inspection), indexed-page counts (`site:` search returned nothing useful and is not evidence), Core Web Vitals field data, server logs.
