# GuiaTV Rebuild Audit — Round 1 (Repo Archaeology)

> Date: 2026-08-12 | Scope: `apps/frontend`, `apps/backend` | Method: static read-only inspection (`grep -rn`, file reads). No build/deploy/restart performed.

This round does not repeat what `docs/frontend-rebuild-audit.md` (2026-04-01), `docs/tv-read-model-audit-2026-03-20.md` and `docs/portal-ux-rework-2026-03-27.md` already established correctly. It **re-verifies those docs against current code**, records what has since changed, and adds the SSR/API evidence those docs didn't cover in file:line depth.

## 0. What the prior docs got right / what's now stale

| Prior claim | Still true? | Evidence |
|---|---|---|
| `frontend-rebuild-audit.md` §4.1: two shells (`app-nav-bar`+`app-left-sidebar` always present, `app-unified-portal-shell` also rendered inside pages) — T-02 "dual layout" | **NO — fixed since 2026-04-01.** | `apps/frontend/src/app/app.component.html:1-8` now only switches between `app-public-layout-shell` (public-shell layout) and a bare `<router-outlet>` for other layouts. `app-public-layout-shell.component.html:1` wraps content in a single `app-unified-portal-shell`. `app-nav-bar`/`app-left-sidebar`/`app-right-sidebar`/`app-header` are **not referenced by any template outside their own component directory** (verified below, §5). They are dead code now, not "duplicated running code." |
| `frontend-rebuild-audit.md` §3 route map (`/canales/:id`, `/explorar`, `/ahora-directo`, `/top-10`, `/mi-lista`, `/canales`, `/comparar-plataformas`, `/estadisticas`, `/desarrolladores`, `/auth/login`) | **NO — route table has moved on.** | Current `apps/frontend/src/app/app.routes.ts` uses different paths for several of these (`/iniciar-sesion`, `/tendencias`, `/comparador-streaming`, `/developers`) and **no longer routes to** `ProgramExplorerComponent`, `AhoraDirectoComponent`, `ListaDestacadasComponent`, `ListaCanalesComponent` at all — their component directories still exist but are unreachable (see §6). `MiListaComponent` no longer exists as a directory at all. |
| `frontend-rebuild-audit.md` §5.1 CSS tokens: distinct accent hexes per section (`--guide-accent-live:#ef4444`, `discover:#f59e0b`, `streaming:#38bdf8`, `sports:#22c55e`) | **NO — regressed.** | Current `design-tokens.scss` defines `--accent-live`, `--accent-discover`, `--accent-streaming`, `--accent-sports`, `--accent-editorial` **all as the identical `#dc2626`** (see §7). The per-section override rules in `unified-portal-shell.component.scss` still exist but their fallback values never apply because the CSS var they reference always resolves. |
| `tv-read-model-audit-2026-03-20.md` — canonical TV read model, `/v2/tv/read*`, `/v2/tv/surface/*` | **Still true**, and frontend (`tv-api.service.ts`) calls exactly these canonical paths. Confirmed in §3. | |
| `portal-ux-rework-2026-03-27.md` — shell/topnav/footer rework, SSR "validated via build" | Build succeeding is not the same as SSR emitting real content — see §2, the actual runtime SSR data path was never audited at the facade level. | |

---

## 1. Route → Feature → Component → Data source → API → SSR → SEO → Auth → Responsive → Tests → Estado → Problemas Matrix

Only routes with non-trivial data flow are expanded; static/legal pages are grouped.

| Route | Component | Data source | Backend API | SSR | SEO risk | Auth | Tests | Problemas |
|---|---|---|---|---|---|---|---|---|
| `/` | `HomeComponent` | `PortalHomeFacade` → `TvDataFacade` + `DiscoveryService` + `EditorialService` | `/v2/discovery/home`, `/v2/tv/read`, `/v2/catalog/platforms`, `/v2/blog` | **BROKEN** — all three facade layers gate on `isBrowser` and return empty (see §2) | **CRITICAL** — homepage SSR HTML ships with no live/tonight/sports/editorial content | none/optional | none found | Triple-layered SSR gate: `PortalHomeFacade` itself gates AND its two dependencies (`TvDataFacade`, `EditorialService`) also gate independently |
| `/programacion-tv/guia-canales` (tab=live) | `UnifiedGuideComponent` → `LiveGuideViewComponent` | `TvDataFacade.readView('now'/'all'/'search')` | `/v2/tv/read` | **BROKEN** (§2) | CRITICAL — main TV guide page, primary SEO surface | none | none found | same root cause as home |
| `/programacion-tv/que-ver-hoy` (tab=discover) | `UnifiedGuideComponent` → `DiscoverViewComponent` | `TvDataFacade.discoverContent()` | `/v2/tv/read`, `/v2/discovery/browse` | **BROKEN** (§2) | CRITICAL | none | none found | same |
| `/plataformas` (tab=streaming) | `UnifiedGuideComponent` → `StreamingViewComponent` | `TvDataFacade.getStreamingContent()` | `/v2/discovery/browse` | **BROKEN** (§2) | CRITICAL | none | none found | same |
| `/deportes` (tab=sports) | `UnifiedGuideComponent` → `SportsViewComponent` | `TvDataFacade.getLiveSports/getUpcomingSports/getTonightSports` | `/v2/tv/read` | **BROKEN** (§2) | CRITICAL | none | none found | same; also 30s client polling (`watchSportsLive`, `tv-data.facade.ts:399-406`) |
| `/programacion-tv/series`, `/programacion-tv/peliculas` | `ContentPageComponent` | `DiscoveryService` (direct, no facade wrapper) | `/v2/discovery/browse` | **OK** — `DiscoveryService` has no `isBrowser` gate | low | optional | none found | Not documented in prior audit at all (new routes) |
| `/canales/:id` | `CanalCompletoComponent` | `TvDataService` (legacy service, distinct from `TvDataFacade`) | `/v2/tv/read*` | **OK** — `tv-data.service.ts` has no `isBrowser` gate | low | none | none found | Ironically the *older* data service is SSR-safe while the *newer* `TvDataFacade` is not |
| `/contenido/:catalogId`, `/peliculas/:slug`, `/series/:slug`, `/programas/:slug`, `/detalles/:id`, `/pelicula-details/:id`, `/program-full-details/:id` | `CatalogDetailComponent` (single component now serves 7 route variants) | `CatalogService` (direct) | `/v2/catalog/:id`, `/v2/catalog/slug/:type/:slug` | OK — no isBrowser gate found | low; legacy variants correctly marked `robots: noindex, follow` | none | none found | 3 of the 7 paths are explicit legacy redirects-of-convenience kept only for old inbound links |
| `/editorial`, `/editorial/rankings`, `/editorial/categoria/:slug`, `/editorial/:slug` (via `BLOG_ROUTES`) | `blog-home`, `top10`, `category`, `post-detail` components | `EditorialService` → `BlogService` | `/v2/blog` | **BROKEN** (§2) | CRITICAL — this is the site's stated SEO content strategy (editorial/blog) and it SSRs empty | none | none found | `EditorialService` gate is redundant: `BlogService.getAllPosts()` itself is SSR-safe (isServer only skips the client retry backoff), so the gate serves no technical purpose |
| `/para-ti` | `ForYouComponent` | `TvDataFacade.getForYou()` | `/v2/discovery/for-you` | irrelevant — `robots: noindex, nofollow`, private-shell, requires auth | n/a | JWT | none found | consistent with its own no-index intent |
| `/admin` | `AdminComponent` + sections | `AdminSchedulesService`, `AdminContentService`, `AdminUsersService`, etc. | `/v2/admin/*` | noindex, guarded | n/a | `adminGuard` + `x-admin-key`/JWT | none found | see §3 for two broken/dead admin endpoints |
| `/tendencias` | `StatsComponent` | not traced in this round | — | — | — | — | — | out of scope for round 1 depth |
| `/embed`, `/embed/programacion` | `EmbedPageComponent`, `EmbedProgramGuideComponent` | not traced in this round | — | minimal-shell | — | — | — | referenced by `oEmbed` endpoint in `index.ts:122-178` |
| `/sitemap` | `SitemapComponent` | `SitemapService` | backend `sitemap.routes.ts` (mounted separately, not under `/v2`, see §3) | — | supports SEO | none | none found | — |

---

## 2. SSR `isBrowser`-guard findings (hard SEO/SSR defects) — exact file:line

The brief singled out `portal-home.facade.ts` and `blog/services/editorial.service.ts`. Both are confirmed broken, but the actual **root cause is one layer deeper**, in `state/tv-data.facade.ts`, which both `PortalHomeFacade` and all four unified-guide views depend on.

### 2.1 `apps/frontend/src/app/state/tv-data.facade.ts` — root cause, 10 SSR-starving guards

Every public data-fetching method returns an empty/fallback value when `!this.isBrowser`, instead of letting `HttpClient` make the (SSR-transferable) request:

- `getChannels()` — line 111-113: `if (!this.isBrowser) { return of([]); }`
- `getGuideSurface()` — line 123-125: `if (!this.isBrowser) { return of(this.emptyGuideSurface(filters)); }`
- `discoverContent()` — line 150-152: `if (!this.isBrowser) { return of(this.emptyDiscoveryResult(...)); }`
- `searchContent()` — line 212-214: same pattern
- `getStreamingContent()` — line 271-283: same pattern
- `getPlatforms()` — line 323-325: `if (!this.isBrowser) { return of(FALLBACK_CATALOG_PLATFORMS); }`
- `getForYou()` — line 333-335: `if (!this.isBrowser || !this.catalogService) { return of([]); }`
- `getLiveSports()` — line 343-345
- `getUpcomingSports()` — line 362-364
- `getTonightSports()` — line 381-383
- `private readView()` — line 412-414: `if (!this.isBrowser) { return of([]); }` — this is the method backing `getLivePrograms()`, `getNextPrograms()`, `getTonightPrograms()`, `getAllPrograms()`, `searchTvPrograms()`, so those five public methods inherit the same defect transitively.

Consumers directly hit by this: `PortalHomeFacade` (`liveNow`, `tonight`, `sportsNow`, `featuredPlatforms`), and all four unified-guide view components (`live-guide-view.component.ts:368`, `discover-view.component.ts:328`, `streaming-view.component.ts:254`, `sports-view.component.ts:321` — each injects `TvDataFacade` directly).

### 2.2 `apps/frontend/src/app/state/portal-home.facade.ts:37-56`

```
getHomeState(): Observable<PortalHomeState> {
    if (!this.isBrowser) {
      return of({ liveNow: [], tonight: [], streamingHighlights: [], sportsNow: [],
        editorialHub: { hero: null, guidePosts: [], rankingPosts: [], trendPosts: [], categorySections: [], categories: [] },
        rankingHighlights: [], featuredPlatforms: [], trendingItems: [], freeItems: [] });
    }
    ...
```
This is a second, redundant gate on top of §2.1 — even if this guard were removed, the inner calls to `tvDataFacade.getLivePrograms/getTonightPrograms/getLiveSports/getPlatforms` (lines 73-76) would still return empty on the server because of §2.1.

### 2.3 `apps/frontend/src/app/blog/services/editorial.service.ts:55-63`

```
this.posts$ = this.isBrowser
      ? this.blogService.getAllPosts().pipe(map(...), catchError(() => of([])), shareReplay(1))
      : of([]);
```
Every public method on `EditorialService` (`getHubState`, `getRankingsPageState`, `getCategoryPageState`, `getPostPageState`, `getPostBySlug`, `searchCategoryBySlug`) is built on top of `this.posts$`, so the whole editorial/blog surface is SSR-empty. Unlike §2.1/§2.2, this one is provably unnecessary: `BlogService.getAllPosts()` (`services/blog.service.ts:87-91`) only uses its own `isServer` flag to skip the client-side retry-with-backoff (`retryWhen`), not to skip the request — the underlying `httpService.get(this.API_URL)` call is SSR-safe on its own.

### 2.4 Confirmed NOT affected (control group)

- `services/discovery.service.ts`, `services/catalog.service.ts`, `state/tv-data.service.ts` (legacy, used by `CanalCompletoComponent`), `state/content.service.ts` — none of these contain `isPlatformBrowser`/`isBrowser` guards on their HTTP calls. Pages built directly on these (`ContentPageComponent` for `/programacion-tv/series` and `/programacion-tv/peliculas`, `CanalCompletoComponent`, `CatalogDetailComponent`) SSR correctly.

**Net effect**: Home, the entire Unified Guide (live/discover/streaming/sports = 4 of the highest-traffic routes), and the entire editorial/blog vertical render an empty content shell in SSR HTML. Client-side hydration re-invokes the same facade methods with `isBrowser=true`, so the app is not broken for interactive users — but crawlers/no-JS fetches and first paint (LCP) get nothing. This is consistent with the site's SEO-dependent business model (guide + editorial content) being undermined at the exact layer meant to serve it.

---

## 3. Backend `/v2/*` canonical surface vs frontend usage

Backend mounts (`apps/backend/src/presentation/routes/index.ts:69-181`), cross-checked against `apps/backend/docs/endpoints-reference.md`:

| Family | Backend mount | Frontend caller | Status |
|---|---|---|---|
| `/v2/tv/read`, `/read/channels`, `/read/channels/:id`, `/read/items/:id`, `/surface/guide`, `/surface/channels/:id` | `tv.routes.ts` | `api/tv-api.service.ts` (all 6 methods map 1:1, confirmed by direct read of file) | **canonical, correctly used** |
| `/v2/discovery/home`, `/browse`, `/search`, `/for-you` | `discovery.routes.ts` | `services/discovery.service.ts` (`baseUrl}/discovery/home\|search\|browse`), `tv-data.facade.ts` (`for-you` via `catalogService.getForYouState`) | **canonical, correctly used** |
| `/v2/catalog`, `/platforms`, `/suggest`, `/slug/:type/:slug`, `/by-slug/:type/:slug`, `/:catalogId` | `catalog.routes.ts` | `services/catalog.service.ts` — `/catalog`, `/catalog/platforms`, `/catalog/suggest`, detail lookups | **canonical, correctly used** |
| `/v2/content/:id`, `/batch`, `/providers/:type/:tmdbId` | `content.routes.ts` | not traced this round | not verified |
| `/v2/blog`, `/blog/categories` | `blog.routes.ts` | `services/blog.service.ts` (`API_URL = buildUrl('/blog')`, `/blog/categories`) | **canonical, correctly used** — but see §2.3 for the SSR gate above it |
| `/v2/admin/sync`, `/precompute`, `/precompute-window`, `/cleanup`, `/cache/clear`, `/reset`, `/health` | `admin.routes.ts` | `services/admin-schedules.service.ts` — hits `${baseUrl}/admin/sync` etc. correctly | canonical, used |
| — | — | `api/tv-api.service.ts:triggerSync/triggerPrecompute/triggerPrecomputeWindow/triggerCacheClear` (lines ~135-151) call `this.client.post('/v2/admin/sync', ...)` | **DUPLICATED + BROKEN, unused.** `ApiConfigService.buildUrl()` (`api-config.service.ts:41-44`) prepends the base (`/v2` in browser, `http://127.0.0.1:4000/v2` in SSR) to whatever path is given. Passing `/v2/admin/sync` into `buildUrl` produces `/v2/v2/admin/sync` — a 404 if ever called. Confirmed unused: `grep` for these four method names outside `tv-api.service.ts` finds zero call sites. The real admin panel uses `admin-schedules.service.ts` instead, which builds the URL correctly. |
| `/v2/admin/users`, `/admin/users/reports` | `admin-users.routes.ts` | not traced this round | not verified |
| `/v2/user/*` (profile, lists, favorites, notifications, export) | `user.routes.ts` | not traced this round | not verified |
| `/v2/social/*` | `social.routes.ts` | not traced this round | not verified |
| `/v2/chat/*` | `chat.routes.ts` | not traced this round | not verified |
| `/v2/ai/*` | `ai.routes.ts` | not traced this round (matches `endpoints-reference.md` §"AI/chat endpoints") | not verified |
| `/v2/analytics/*`, `/v2/telemetry/*` (same controller mounted twice — `index.ts:119-120`) | `analytics.routes.ts` | frontend calls `/telemetry/session/start\|heartbeat\|end`, `/telemetry/event` (grep confirmed) | canonical, correctly used |
| `/v2/lists/public` | `lists-public.routes.ts` | not traced this round | not verified |
| **Removed legacy** `/v2/channels`, `/v2/channels/:id/programs`, `/v2/programs`, `/v2/schedules/*`, `/v2/layouts/*`, `/v2/ssr/now-playing` (per `endpoints-reference.md:524-535`) | not mounted | **`services/admin-schedules.service.ts:92-95` — `getChannels()` calls `${baseUrl}/channels`** | **BROKEN.** This is one of the routes the backend docs explicitly say was removed. Called from `pages/admin/sections/schedules/admin-schedules-section.component.ts:73`. Any admin using the Schedules section's channel list will get a 404/empty response. (Contrast: `services/admin-content.service.ts:48` correctly uses canonical `/tv/read/channels` for the same kind of lookup in the Content admin section — the two admin sections are inconsistent with each other.) |

RUNBOOK.md's own validation checklist confirms the intended canonical set (`/v2/catalog/platforms`, `/v2/discovery/home`, `/v2/tv/surface/guide`, `/v2/catalog`, `/v2/discovery/for-you`, `/v2/user/interactions`) — all match what's mounted and what the frontend calls, except for the two admin issues above.

Sitemap routes (`sitemap.routes.ts`) are defined but **not mounted under `createV2Routes`** in `index.ts` — they must be wired in elsewhere (e.g. directly on the Express app, not the `/v2` router), consistent with RUNBOOK.md checking `https://guiaprogramaciontv.com/sitemap.xml` (no `/v2` prefix). Not independently verified where `createSitemapRoutes` is mounted; flagged for round 2.

---

## 4. Design tokens — semantic accent colors are NOT visually distinct

`apps/frontend/src/styles.scss` no longer defines color tokens directly (contrary to what `frontend-rebuild-audit.md` §5.1 describes) — it only does `@use './styles/design-tokens';` (`styles.scss:3`) and sets `body` background/color from `--portal-bg`/`--portal-text`.

`apps/frontend/src/styles/design-tokens.scss:47-52`:
```scss
--accent-live: #dc2626;
--accent-live-soft: rgba(220, 38, 38, 0.1);
--accent-discover: #dc2626;
--accent-discover-soft: rgba(220, 38, 38, 0.1);
--accent-streaming: #dc2626;
--accent-streaming-soft: rgba(220, 38, 38, 0.1);
--accent-sports: #dc2626;
--accent-sports-soft: rgba(220, 38, 38, 0.1);
--accent-editorial: #dc2626;
--accent-editorial-soft: rgba(220, 38, 38, 0.1);
```
All five semantic accents (live/discover/streaming/sports/editorial) are the **same red** (`#dc2626`). `--guide-accent-discover`, `--guide-accent-streaming`, `--guide-accent-sports` (lines 65-68) all chain to these, so they resolve to `#dc2626` too.

`apps/frontend/src/app/components/unified-portal-shell/unified-portal-shell.component.scss:611-624` still contains the intended per-tone overrides with distinct fallback colors:
```scss
.portal-shell--discover, .portal-shell--home, .portal-shell--editorial, .portal-shell--rankings {
  --guide-accent: var(--guide-accent-discover, #f59e0b);   // amber fallback never used
}
.portal-shell--streaming { --guide-accent: var(--guide-accent-streaming, #38bdf8); }  // sky fallback never used
.portal-shell--sports    { --guide-accent: var(--guide-accent-sports, #22c55e); }     // green fallback never used
```
Because `--guide-accent-discover`/`streaming`/`sports` are always defined (just always red), the `var(x, fallback)` fallback branch never activates. **The section-tone system exists structurally in the CSS but is functionally dead: every section (live TV, discover, streaming, sports, editorial) renders with the identical red accent.** This is a design regression relative to what `frontend-rebuild-audit.md` documented as working on 2026-04-01, and it directly contradicts the `AGENTS.md` UX/UI mission ("TV Guide Visual Distinction").

---

## 5. Legacy/dead component confirmation (updates to prior audit §6.2)

Grepped every selector from the prior audit's "candidates to eliminate" list against all `*.html` templates, excluding matches inside the component's own directory:

| Selector | External usages found | Verdict |
|---|---|---|
| `app-nav-bar` | 0 | **Dead** — confirmed unused, safe to delete |
| `app-left-sidebar` | 0 | **Dead** |
| `app-right-sidebar` | 0 | **Dead** |
| `app-header` | 0 | **Dead** |
| `app-card-channel` | 0 | **Dead** |
| `app-post-card` | 0 | **Dead** |
| `app-post-card-last` | 0 | **Dead** |
| `app-ficha-programa` | 0 | **Dead** |
| `app-program-details` | 0 | **Dead** |
| `app-menu`, `app-slider`, `app-card-slider`, `app-catalog-rail`, `app-card-list`, `app-catalog-card`, `app-program-list`, `app-banner` | 1-2 each | **Still active legacy** — not safe to delete without replacing call sites first |

## 6. Orphaned pages (routed in old audit, no longer in `app.routes.ts`)

These component directories exist under `apps/frontend/src/app/pages/` but have **zero matching path in current `app.routes.ts`** (confirmed by grep across the whole routes file):

- `pages/program-explorer` (`ProgramExplorerComponent`, was `/explorar`)
- `pages/ahora-directo` (`AhoraDirectoComponent`, was `/ahora-directo`)
- `pages/lista-destacadas` (`ListaDestacadasComponent`, was `/top-10`; superseded by `blog/pages/top10`)
- `pages/lista-canales` (`ListaCanalesComponent`, was `/canales`)

`pages/mi-lista` no longer exists on disk at all (fully removed, not just unrouted). These four are unreachable in the running app; either dead weight to delete or features that regressed out of the route table unintentionally — worth a product decision before round 2 touches them.

## 7. Admin analytics duplication (re-check of prior T-16)

Still present, evidence:
- `apps/frontend/src/app/pages/user-area/components/admin-analytics/admin-analytics.component.ts`
- `apps/frontend/src/app/pages/admin/sections/analytics/admin-analytics-section.component.ts`
- `apps/frontend/src/app/services/admin-analytics.service.ts`

Not re-traced in depth this round (naming differs slightly from the prior audit's exact claim); flagged for round 2 to determine if they're truly duplicate logic or a legitimate user-area/admin split.

## 8. Tests and CI hooks

- Frontend `apps/frontend/package.json`: **no `test` or `lint` script defined at all.** Only `ng`, `start`, `build*`, `serve*`, `dev*`, `prerender` scripts exist. `find apps/frontend/src -iname "*.spec.ts"` → 7 files total (Angular CLI defaults / scaffolding, not systematic coverage).
- Backend `apps/backend/package.json`: `"test": "npm run build --silent && node --test dist/**/*.test.js"`, `"lint": "tsc -p tsconfig.json --noEmit"` (type-check only, not an actual linter). `find apps/backend -iname "*.test.ts"` → 6 files.
- No `tests/`, `e2e/`, or `playwright/` directory anywhere in the repo (only a Claude Code skill reference at `.claude/skills/playwright-e2e`, not project test infrastructure).
- **This directly contradicts the root `CLAUDE.md` rule "ALWAYS run tests after making code changes" / "ALWAYS verify build succeeds before committing" for the frontend** — there is no frontend test command to run, and coverage of the 4 SSR-critical routes found in §2 is zero.

## 9. Build/test commands for later rounds (from package.json, confirmed by direct read)

```bash
# Root (monorepo)
npm run build              # backend build + frontend SSR build
npm run build:backend      # apps/backend only (tsc && tsc-alias)
npm run build:frontend     # apps/frontend SSR only (ng build --configuration production --ssr)
npm run publish:release    # node scripts/publish-release.mjs
npm run start:api / start:ssr
npm run job:syncEPG / job:precompute / job:clean
npm run db:bootstrap

# apps/frontend (no test/lint script exists)
npm run build               # ng build (browser only, no SSR)
npm run build:ssr           # ng build --configuration production --ssr
npm run dev:ssr              # ng serve --configuration development-ssr --proxy-config proxy.conf.js --port 3000
npm run dev:non-ssr          # ng serve --configuration development --proxy-config proxy.conf.js --port 4200

# apps/backend
npm run build   # tsc && tsc-alias
npm run test    # build then node --test dist/**/*.test.js
npm run lint    # tsc --noEmit (type-check, not eslint/prettier)
```

---

## 10. Open items for round 2 (not traced this round — flag, don't assume)

- `/v2/content/*`, `/v2/user/*`, `/v2/social/*`, `/v2/chat/*`, `/v2/ai/*`, `/v2/admin/users/*`, `/v2/lists/public` — backend routes exist; frontend callers not cross-referenced yet.
- Where `sitemap.routes.ts` actually gets mounted (not present in `createV2Routes`).
- `/tendencias` (`StatsComponent`), `/embed*`, admin sections beyond schedules/content/analytics — data source and SSR behavior not traced.
- `admin-analytics` duplication — confirm real overlap vs. legitimate split (§7).
- Whether the 4 orphaned pages in §6 should be deleted or re-routed.
