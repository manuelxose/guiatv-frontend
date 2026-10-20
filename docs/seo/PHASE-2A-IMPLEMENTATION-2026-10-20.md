# GuíaTV — Phase 2A implementation report (2026-10-20)

Branch `fix/seo-phase-2a` from `main` @ `a2500ae` (= production release `20261020110434`). Implementation commit `7558e33`; this report is the commit after it. **Not merged, not deployed.** Every "after" value below comes from a local candidate (this branch's production SSR build, run locally against the production public API, or this branch's backend against the local DB). None of it describes production, which is unchanged until deploy.

No Search Console data is used or reproduced here. `.runtime/gsc/` and the Phase 1 report were not touched.

## 1. Issues fixed: before / after

| Issue | Before (production, verified today) | After (local candidate) | Evidence |
|---|---|---|---|
| **TS-04** football guides duplicated | `/deportes/futbol/noticias/movistar-plus-vs-dazn` 200, `index`, self-canonical, separate `NewsArticle` page | 301 → `/guias/movistar-plus-vs-dazn` (one hop, query kept, legacy slugs go straight to the final target). Duplicate page and its `NewsArticle` JSON-LD deleted; news cards and search link to `/guias/<slug>`. The target is 200, `index`, self-canonical, with one Article and one BreadcrumbList | resilience probes, crawl probes |
| **TS-05** `/tendencias` loading screen | SSR HTML "Cargando contenidos populares…" + `index, follow` | SSR HTML lists 10 real catalogue items. It is `noindex` while loading, on error, or with fewer than 5 items. Root cause: OnPush view never re-rendered after the data arrived, while the meta had already switched to `index` | `stats.component.spec.ts`, resilience probe (API down → `noindex`, no loading text) |
| **TS-10** duplicate BreadcrumbList | 2 BreadcrumbLists on every football page; the page-level one had no `@context` and sometimes different names | 1 BreadcrumbList per page (the visible breadcrumb's, with `@context`) | JSON-LD extraction on 7 football URLs |
| **TS-11** `/deportes` | 302 → `/deportes/futbol` (Angular `redirectTo`) | 301 → `/deportes/futbol`, query kept | resilience probe |
| **TS-17** rankings category | `/guias/categoria/rankings` 200, `index`, listed in the sitemap | 301 → `/guias/rankings`. `/editorial|blog/categoria/rankings` → `/guias/rankings` in one hop. Removed from `sitemap-blog.xml`; also redirected for in-app navigation | resilience probes, sitemap test |
| **TS-08** affiliate links | `/v2/affiliate/go/…` links `rel="noopener noreferrer"`; redirect crawlable, no robots header | Every click-tracking redirect link (`/v2/affiliate/go/`, `/v2/monetization/go/`) gets `nofollow`; `sponsored` is added only when the offer is commission-bearing (`affiliate_configured`, unchanged business rule). Plain editorial links are unchanged. Both redirect endpoints send `X-Robots-Tag: noindex, nofollow`; `robots.txt` disallows both paths. Disclosure logic was already gated on `sponsored` everywhere, so it was left as is. Home now renders 8× `rel="nofollow noopener noreferrer"` | specs (CTA, where-to-watch, comparator), controller tests |
| **TS-09** match slug / schema | `…-2026-10-19` slug for a 01:00 Madrid kickoff → "Partido no encontrado". `BroadcastEvent` without `@context` | Slug date = Europe/Madrid kickoff day. Lookup falls back from the cached "today" snapshot to the dated range around the slug's day, and still resolves legacy UTC-dated slugs. Match and team JSON-LD carry `@context`. Result / no-result states unchanged (no-result stays `noindex, follow`) | normalizer + adapter tests (DST, CET/CEST, offset ISO, legacy slug, miss), `football-seo.spec.ts` |
| **TS-13** sitemap `lastmod` | Programme `lastmod` = airing start (tomorrow → future dates); "today" on all static and category URLs | Programmes: newest `updatedAt` of the read-model rows behind the page, clamped to today, omitted if unknown. Posts: `updatedAt`/`publishedAt`; rankings hub and categories: newest post. "Today" only on pages whose content is the day's schedule or catalogue; 13 stable pages (legal, about, hubs) have no `lastmod`. Never in the future | `SitemapController.test.ts`; local backend: 0 future dates in every child sitemap |
| **TS-15** "A continuación" | At 13:41 production listed 08:55–13:20, **19 oct 23:00–02:15** and 02:15 airings as upcoming | Candidate lists 13:45, 15:00, 15:30 only. Backend: related items query `airing.end > now` and drops ended items from the 30-min cached response. Frontend: on air = `start ≤ now < end`, upcoming = `start > now`, compared as instants | `TvReadQueryService.test.ts`, `catalog.spec.ts`, live comparison |
| **TS-07** embed widget | `/embed/programacion` 503 + `Retry-After`; `X-Frame-Options: SAMEORIGIN` everywhere | 200 + `noindex, follow`; `Content-Security-Policy: frame-ancestors *` and no XFO **on that path only**; every other route keeps `SAMEORIGIN` and sends no CSP. In a page served from another origin (`localhost:3192` framing `127.0.0.1:3191`), the iframe renders the real grid (LA 1, LA 2, Antena 3… with live data). The control (`/embed` framed cross-origin) is refused by SAMEORIGIN. The widget uses no `postMessage`, so there was no origin validation to add | resilience probes, Playwright cross-origin check |

## 2. Files changed (54 + 2 docs)

- SSR server and robots: `apps/frontend/scripts/ssr-server.mjs`, `apps/frontend/src/robots.txt`
- Football (frontend): `football.routes.ts`, `football-seo.ts` (+spec), `football.facade.ts`, `football-news-card`, 8 page components (breadcrumb JSON-LD removed), `pages/football-news-detail/` **deleted**
- Affiliate: `services/affiliate.service.ts` (`outboundRel`), `affiliate-cta`, `where-to-watch`, `streaming-comparison` (+ spec updates); backend `AffiliateController`, `MonetizationController` (+tests)
- Trends: `pages/stats/stats.component.ts` (+ new spec)
- Programme airings: `pages/catalog-detail/catalog-detail.component.ts`, `utils/catalog.ts` (+ new spec); backend `TvReadQueryService.ts` (+test)
- Match slugs: backend `FootballNormalizer.ts`, `FootballDataOrgAdapter.ts`, `EpgFootballDataProvider.ts` (+tests)
- Sitemap: backend `SitemapController.ts` (+tests), `TvReadQueryService.ts` (row `updatedAt`)
- Rankings: `blog/blog.routes.ts`; unified search link
- Regression tooling: `scripts/seo-ssr-resilience.mjs` (redirect, widget-header, `/tendencias` probes); `scripts/seo-crawl.mjs` (can crawl a local candidate: fetches each sitemap loc from the given base, checks canonical against the loc)
- Docs: `docs/seo/redirect-map.csv` (4 new rows), this report

## 3. Skills

None of `seo-technical`, `seo-schema`, `seo-sitemap`, `mk-seo-audit` could be **invoked**: this session's skill list doesn't include the project skills (they live in the git-ignored `guiatv-frontend/.claude/skills/`, and the session started at `workspace/`). I read each SKILL.md and applied its checklist by hand: single-hop redirects, canonical and noindex consistency, `@context`/`@type` on every JSON-LD block, sitemap lists only canonical 200 URLs, `lastmod` honest and never in the future. The repo scripts and tests did the actual validation. `claude-seo setup` was not run and no dependency was installed.

## 4. Tests

| Check | Result |
|---|---|
| Backend `npm test` (node:test) | **360 pass**, 0 fail, 1 skip (Redis presence, `TEST_REDIS_URL` not set; environmental). New: Madrid slug/DST, `matchHasSlug`, cross-midnight `getMatch`, `airingsNotEnded`, 2 sitemap `lastmod` tests, `X-Robots-Tag` on both redirect controllers |
| Backend lint (`tsc --noEmit`) | clean |
| Frontend Karma | **264/264**. New: `catalog.spec`, `football-seo.spec`, `stats.component.spec`, CTA editorial-link case. 2 specs updated to the intended new `rel` |
| Frontend ESLint (changed files) | 0 errors (warnings only: existing `any`/`prefer-inject` style) |
| SSR production build | ok |
| `npm run seo:ssr-resilience` | all ok: 11 outage routes 503/no-store/noindex, 8 redirects single-hop 301, widget 200/noindex/`frame-ancestors *`/no XFO, other routes SAMEORIGIN, `/tendencias` noindex without data |
| Playwright (football, editorial, navigation-unification, error-states, streaming; 1 worker) | 17 pass, 16 fail, 2 skip. **Identical failure set on `main`** (same run against `a2500ae`), so not a regression. Causes: local DB is stale (EPG ends 7 Sep), plus pre-existing issues such as the 320 px overflow (TS-06) and nav-count expectations. A first run with 2 workers OOM-killed the dev server (WSL ~5 GB) |
| Cross-origin iframe (Playwright, throwaway script) | widget renders real data from a foreign origin; SAMEORIGIN control blocked |
| `seo:crawl` against local candidate (306 sitemap URLs + 11 probes) | Only remaining issues: `/guias/categoria/rankings` (301, expected: the production sitemap still lists it; this branch's sitemap doesn't), and 2 transient 503s caused by the production API rate-limiting my IP (429) during the crawl. Both URLs return 200 on re-probe. The SSR behaviour under 429 was correct (503 + noindex) |
| JSON-LD | parsed on 8 pages: valid JSON, every top-level block has `@context`. Google Rich Results Test **not run** (needs public URLs, so after deploy) |
| Local backend sitemaps | 0 future `lastmod` in every child; static: 10 schedule pages dated, 13 undated; blog: real post dates, no rankings category. Channel/programme sitemaps are empty locally (stale DB), so that path is covered by unit tests only |

## 5. Known limitations

1. **Widget time display (pre-existing, not fixed):** at iframe width (≤ 420 px) the widget prints raw ISO timestamps (`2026-10-19T21:00:00.000Z`) and opens on the 00:00–03:00 slot. Production shows the same in a same-origin browser. The cause is in the shared `program-list` mobile layout, which also renders the home and channel grids, so changing it is beyond a low-risk fix. Recommended for 2B before the widget is promoted.
2. Football detail pages now get the visible breadcrumb's generic trail (Inicio › Fútbol › section) instead of a deeper invisible one. That is correct (schema must match the visible breadcrumb), but less specific; making the visible breadcrumb specific is UI work.
3. Legacy UTC-dated match slugs resolve (200, canonical → new slug) but aren't 301-redirected.
4. "Partido no encontrado" is still 200 + `noindex, follow` (not 404); unchanged on purpose (no historical-match policy in 2A).
5. `/deportes/futbol/noticias` (the list) remains an indexable hub; its cards now link to `/guias`.
6. A match-detail miss in the cached snapshot now costs one dated provider call (rate-limited free tier). The 60 s detail cache in `FootballQueryService` absorbs repeats.
7. If the EPG precompute rewrites every read-model row daily, programme `lastmod` will be daily too. That's accurate (the page was regenerated) but not very informative.
8. `frame-ancestors *` lets any site frame the widget, as requested. The widget has no state-changing actions and its links open in a new tab.

## 6. Remaining risks

- Match slugs change for kickoffs between 00:00 and 02:00 Madrid time. Old URLs keep resolving (`matchHasSlug`), but external links to the old form get a canonical, not a redirect.
- Frontend and backend must ship together: the fixed slugs come from the API, and the 301s and widget headers come from the SSR server.
- nginx caches SSR 200s for 5 min (`proxy_cache_valid 200 5m`). For up to 5 min after deploy, `/tendencias` and the football pages may serve the old HTML.
- Search Console will report the new 301s (football guides, rankings category) under "Page with redirect". That's expected.

## 7. Deployment recommendation

**Ready for review; recommend deploying after owner review, backend and frontend in the same release.** No migration, no data change, no new dependency. After deploy, re-check production with:

1. `curl -I` for `/deportes`, `/deportes/futbol/noticias/movistar-plus-vs-dazn`, `/guias/categoria/rankings` (301, single hop) and `/embed/programacion` (200, `noindex`, `frame-ancestors *`, no XFO); `/` still `SAMEORIGIN`.
2. `npm run seo:crawl` on production: expect 0 issues (the new sitemap no longer lists the rankings category).
3. `sitemap-programs.xml`: no `lastmod` later than today.
4. A football match page with a 00:00–02:00 Madrid kickoff resolves; Rich Results Test on one match page and one guide.
5. `/programas/<airing today>`: "A continuación" starts after now.
6. Home HTML: `/v2/affiliate/go` links carry `nofollow`; `robots.txt` shows the two new `Disallow` lines.

Production must not be called fixed until these pass on the deployed release.
