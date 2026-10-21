# GuíaTV — Phase 1 master audit (2026-10-20)

Read-only audit. No application code, configuration, existing report or production data was changed; nothing was committed or deployed. This file and a private Search Console appendix (`.runtime/gsc/2026-10-20-api/PHASE-1-GSC.md`, git-ignored) are the only files written.

Evidence labels: **[V]** verified this session (command/URL/file), **[H]** historical (earlier report, not re-verified), **[Hyp]** hypothesis, **[U]** unverified assumption.

---

## A. Executive summary

- **Technical baseline is healthy where it was recently worked on [V]:** all 306 sitemap URLs return 200, self-canonical, one H1, valid JSON-LD; every 301 in `redirect-map.csv` is a single hop; unknown URLs return 404 + noindex; query strings canonicalise; SSR outage behaviour (503 + no-store + noindex) passes 11/11.
- **The main structural defect is the programme/catalogue URL model [V]:** programme pages exist only while a title is in the EPG window, then 404 (most of the "not found" URLs in Search Console are `/programas/*`). The same title is reachable as `/series/x`, `/programas/x` and `/programas/x-t3` (all indexable, self-canonical). Slugs drop accented letters (`/programas/espejo-pblico` 200, `/programas/espejo-publico` 404). The site can't build lasting ranking pages for the thing a TV guide is searched for most: a programme name.
- **New confirmed defects not in earlier reports [V]:** football guides duplicated under `/deportes/futbol/noticias/*`; `/tendencias` server-renders only "Cargando…" yet is indexable and linked from every footer; horizontal overflow at 390 px on `/deportes/futbol/partidos-hoy` (+221 px) and `/canales/la-1` (+545 px); the advertised embeddable widget can't work on third-party sites (client-only route answered with 503, plus a global `X-Frame-Options: SAMEORIGIN`); match links that cross midnight open "Partido no encontrado"; affiliate redirects without `rel="sponsored"`.
- **Organic performance is negligible, not "declined from a meaningful level" [V, private appendix]:** a handful of clicks in 90 days; the large majority of impressions were the home page on generic "guía tv" queries at positions ~40–60, which vanished on 1 Sep. The only post-September clicks come from football long-tail queries → `/deportes/futbol`. No recovery is claimed.
- **Editorial corpus [V]:** 10 public posts, all AI-assisted, all published 19–20 Oct, all attributed to one reviewer. The repo gate passes them (0 blocking). Five are near-identical TMDB-rating templates. The earlier master report records that the named reviewer delegated verification to Claude, while the pages say "Revisión editorial". That needs an owner decision.
- **AdSense: NO-GO.** The blockers are concrete: no consent management platform (CMP) for EEA ads, a cookie policy that describes cookies the site doesn't set, indexable empty or error screens, and a very thin, very new original corpus. Approval is Google's decision; no score is given.

## B. Repository and deployment baseline

| Item | Value | Label |
|---|---|---|
| Repo | `manuelxose/guiatv-frontend`, branch `main`, clean tree, up to date with `origin/main` | [V] |
| HEAD | `a2500ae` feat(deploy): submit the sitemap to Search Console after every deploy (#14) | [V] |
| Production | release `20261020110434`, released 2026-10-20T09:04:36Z, `gitSha a2500ae…` = HEAD (read from `/var/www/guiatv/current/release.json`) | [V] |
| Open PRs | none (`gh pr list`) | [V] |
| Recent merged | #10 football dates/HBO Max, #11 Guías restructure + 301s, #12–#13 deploy smoke checks, #14 GSC sitemap submit | [V] git log |
| Workspace superproject | shows the `guiatv-frontend` gitlink as modified (pointer behind) — not part of this repo | [V] |
| Agent instructions | workspace `AGENTS.md` + `.claude/CLAUDE.md`; no `AGENTS.md`/`CLAUDE.md` inside this repo | [V] |
| Tests run this session | `seo:crawl` (prod), `seo:editorial-audit` (prod), `seo:ssr-resilience` (local build, 11/11 ok). Not run: unit suites, Playwright, Lighthouse, Rich Results | [V] |

## C. Skill inventory

All 17 requested skills live in `guiatv-frontend/.claude/skills/` (git-ignored by `.gitignore:81`), copied by hand on 2026-10-19 from claude-seo `4b99de2` and marketingskills `06d647e` [H, SKILL-INVENTORY.md].

| Skill | Installed / SKILL.md readable | Runtime deps | Invocable this session | Use | Overlap |
|---|---|---|---|---|---|
| seo (router) | yes / yes (317 lines) | Python env + Chromium; optional DataForSEO, PSI, CrUX, GA4 keys. `claude-seo doctor` → **"setup required"** (managed env missing, Chromium not installed) | **No** — not in this session's skill list (session root is `workspace/`, skills are project-scoped) | full-audit orchestration | all seo-* |
| seo-technical | yes / yes | Python for some checks; PSI/CrUX optional | No | crawl/indexability/CWV | mk-seo-audit, repo `seo-crawl.mjs` |
| seo-sitemap | yes / yes | Python `sitemap_discovery.py` | No | sitemap validation | `seo-crawl.mjs` |
| seo-page | yes / yes | minimal | No | single-page deep dive | seo-content |
| seo-schema | yes / yes | minimal | No | JSON-LD validation/generation | mk-schema |
| seo-content | yes / yes | Python optional; DataForSEO optional | No | E-E-A-T/content quality | `editorial-audit.mjs`, mk-copy-editing |
| seo-cluster | yes / yes | DataForSEO for SERP overlap (paid) | No | topic clusters | mk-content-strategy |
| seo-content-brief | yes / yes | DataForSEO optional | No | briefs | mk-content-strategy |
| seo-google | yes / yes | Python + Google OAuth/service account; GSC/PSI/CrUX/GA4 | No | GSC/URL inspection | repo `gsc-compare.mjs`; server service account (used read-only this session) |
| mk-seo-audit | yes / yes (pure Markdown) | none | No | audit checklist | seo-technical |
| mk-site-architecture | yes / yes | none | No | IA/URL hierarchy | — |
| mk-content-strategy | yes / yes | none | No | pillar/cluster planning | seo-cluster |
| mk-programmatic-seo | yes / yes | none | No | rules for templated pages (programme/channel/match) | — |
| mk-copywriting | yes / yes | none | No | hub intros, titles | mk-copy-editing |
| mk-copy-editing | yes / yes | none | No | editorial pass | seo-content |
| mk-schema | yes / yes | none | No | schema | seo-schema |
| mk-analytics | yes / yes | GA4 (not installed on site) | No | measurement plan | seo-google |

Setup needed before Phase 2 (owner approval): (1) start the Phase 2 session **from `guiatv-frontend/`** so the project skills load; (2) optionally `claude-seo setup` (local Python env + Chromium download; free, large) only if the Python checks are wanted. The repo scripts already cover crawl, resilience, editorial and GSC comparison, so (2) isn't required. Paid APIs (DataForSEO) aren't recommended.

## D. Technical SEO findings (by severity)

No P0 (site-down / deindexing-level) defect is confirmed.

**TS-01 · P1 · Programme URLs are ephemeral** — Evidence [V]: 12/12 sampled URLs from GSC's 404 list still 404 (e.g. `/programas/aqu-no-hay-quien-viva-captulo-14-…`, `/programas/minority-report`); GSC "not found" inventory (12 Oct UI snapshot, private) is dominated by `/programas`, then `/peliculas` and `/series`; `sitemap-programs.xml` holds only the 193 titles airing around today (lastmod 19–21 Oct). Path: `apps/backend/src/application/services/CatalogService.ts` (`findTvReadItemBySlug`, EPG-window lookup), programme sitemap generator. Intent: "cuándo echan X", "X horario", "X dónde ver". Action: one persistent page per programme/series entity (show-level slug) that answers 200 with next airings, or "no está programado; dónde verlo en streaming"; 410 only for one-off events; sitemap lists persistent entities with real lastmod. Benefit: URLs can accumulate signals; ends the 404 churn. Verify: unknown-window title returns 200 with useful content; GSC "not found" trend falls. Confidence: high.

**TS-02 · P1 · Same title on several indexable URLs** — Evidence [V]: `/series/friends`, `/programas/friends`, `/programas/friends-t3`, `/series/friends-t3` all 200, `index`, self-canonical; `/series/the-office` and `/programas/the-office` likewise; 31 sitemap URLs carry season/episode suffixes (`-t1-e2`, `-t01-e05`); home links to `/series/*` while the sitemap lists `/programas/*`. Path: `apps/frontend/src/app/app.routes.ts:200-226` (`peliculas`, `series`, `programas` routes), slug construction in `CatalogService.ts:738`. Action: choose one canonical entity URL per title (season/episode as on-page sections or `#anchors`), 301 the rest. Benefit: removes duplication and split signals. Verify: crawl asserts one 200 per entity, others 301. Confidence: high.

**TS-03 · P1 · Slugs drop accented letters** — Evidence [V]: `/programas/espejo-pblico` 200 vs `/programas/espejo-publico` 404; `maaneros-360-t3`, `cdigo-10`, `equipo-de-investigacin`. Path: `CatalogService.ts:908` `slugify` (`[^\w-]` strips "ú"), `apps/frontend/src/app/utils/utils.ts:701`; `utils/catalog.ts:96` `slugifyTitle` already transliterates and documents the legacy choice. Action: transliterate for new canonical URLs as part of TS-01/02, with 301s from legacy spellings. Don't change in isolation, because that would create a third URL per title. Benefit: readable URLs that match queries. Verify: both spellings resolve, legacy 301 → new. Confidence: high.

**TS-04 · P1 · Football guides duplicated** — Evidence [V]: `/deportes/futbol/noticias/movistar-plus-vs-dazn` 200, `index`, self-canonical, same article as `/guias/movistar-plus-vs-dazn` (also LaLiga and Champions guides; linked from `/deportes/futbol/noticias`). Path: `apps/frontend/src/app/features/football/football.routes.ts` (`noticias/:slug`). Action: 301 to `/guias/<slug>` (or canonical to it) and link the hub to `/guias`. Benefit: no self-cannibalisation of the only original content. Verify: crawl probe. Confidence: high.

**TS-05 · P1 · `/tendencias` serves a loading state** — Evidence [V]: SSR main content is "Contenidos populares del catálogo de Guía TV. Cargando contenidos populares…"; `index, follow`; linked in every footer; not in the sitemap. Action: SSR the list, or `noindex` and drop it from the footer until it has content. Benefit: removes an empty indexable screen (soft-404 and AdSense low-value risk). Verify: SSR HTML contains items. Confidence: high.

**TS-06 · P1 · Horizontal overflow on mobile** — Evidence [V] (Playwright, 390×844): `/deportes/futbol/partidos-hoy` scrollWidth +221 px (`app-football-matches` root 759 px wide; H1 and intro cut off, screenshot `m_deportes_futbol_partidos_hoy.png` in the session scratchpad); `/canales/la-1` +545 px (`app-unified-program-card` 536 px). 0 px on `/`, `/guias`, `/plataformas`, `/programacion-tv/en-directo`, a programme page. Only `la-1` was tested among the 76 channel pages, so the others are probably affected [Hyp]. Path: `features/football/pages/football-matches/`, `components/unified-program-card/`, `pages/canal-completo/`. Action: fix min-width/flex overflow; add an e2e overflow assertion over one URL per template. Benefit: mobile usability (Google indexes mobile-first). Verify: scrollWidth == innerWidth at 360/390 px. Confidence: high.

**TS-07 · P1 · Embeddable widget unusable off-site** — Evidence [V]: `/embed/programacion` returns **503** + `noindex` + `Retry-After` on every request (it's `RenderMode.Client`, `app.routes.server.ts:29`; the empty render falls to `ssr-server.mjs:474`), and every response carries `X-Frame-Options: SAMEORIGIN` (`ssr-server.mjs:278`), so browsers refuse to frame it on other domains. `/embed` (in the sitemap, footer "Widget") publishes the iframe snippet. Action: serve the client route as 200 + noindex (as already done for private routes) and replace XFO with `Content-Security-Policy: frame-ancestors *` for `/embed/programacion` only. Benefit: a working distribution/backlink channel. Verify: curl status/headers; iframe test page on another origin. Confidence: high.

**TS-08 · P1 · Affiliate redirects without `rel="sponsored"`** — Evidence [V]: home links `/v2/affiliate/go/…?placement=home…` with `rel="noopener noreferrer"`; the redirect answers 302 to `amazon.es/amazonprime`. `rel` gets `sponsored` only when the offer flag is set (`components/affiliate-cta/affiliate-cta.component.html:26`, `where-to-watch.component.ts:214`); `robots.txt` allows `/v2/`. Whether this particular offer pays commission is **[U]** (redirect parameters not inspected). Action: every `/v2/affiliate/go` link gets `rel="sponsored nofollow"`; `Disallow: /v2/affiliate/` and `X-Robots-Tag: noindex` on the redirect; exclude bot user agents from click stats [Hyp: crawler hits currently count as clicks]. Benefit: compliance with Google's link-spam policy; clean affiliate metrics. Verify: grep the SSR HTML. Confidence: medium-high.

**TS-09 · P2 · Football match pages: date bug and schema** — Evidence [V]: from today's list, `/deportes/futbol/partido/sc-corinthians-paulista-ec-vitoria-2026-10-19` → 200 "Partido no encontrado" (noindex): a match that crosses midnight (UTC vs Madrid vs local) builds a slug the lookup can't resolve. Other matches resolve. Match pages are indexable, absent from the sitemap and ephemeral; their `BroadcastEvent` JSON-LD is a separate `<script>` **without `@context`**. Action: resolve slug dates in Europe/Madrid consistently (same rule as PR #10); add `@context`; policy for past matches (keep result pages or noindex after N days). Verify: unit test on a 23:30–01:00 kickoff; Rich Results Test. Confidence: high (bug), medium (lifecycle policy).

**TS-10 · P2 · Duplicate BreadcrumbList on football hubs** — Evidence [V]: two BreadcrumbList blocks on `/deportes/futbol`, `/partidos-hoy` (with different names: "Partidos" vs "Partidos de fútbol hoy"), `/competiciones`, `/noticias`. Action: keep the visible-breadcrumb schema only (as was done for posts). Confidence: high.

**TS-11 · P2 · `/deportes` redirects with 302** — Evidence [V]: `curl` 302 → `/deportes/futbol` (Angular `redirectTo`, `app.routes.ts:155`); the URL had impressions in GSC. Action: 301 in `ssr-server.mjs` like the other permanent redirects. Confidence: high.

**TS-12 · P2 · Valuable football pages missing from sitemaps** — Evidence [V]: `/deportes/futbol/competiciones/laliga`, `/uefa-champions-league`, team pages (`/equipos/paris-saint-germain-fc`), `/deportes/futbol/calendario` are 200 + index but not in any sitemap (static sitemap lists only 4 football URLs). Action: add competitions (stable) and the calendar; decide on teams after a quality check. Benefit: discovery of the only section with measured demand. Confidence: high.

**TS-13 · P2 · Inaccurate `lastmod`** — Evidence [V]: all static/channel URLs carry today's date; 39 programme URLs carry **tomorrow's** date (2026-10-21). Google ignores lastmod it can't trust. Action: real content-change dates; never future dates. Confidence: high.

**TS-14 · P2 · Home payload** — Evidence [V]: home HTML 810 KB, of which 528 KB is Angular transfer state (`ng-state`). Lab Lighthouse (19 Oct, single mobile run) 84 / LCP 3.4 s [H]; field CWV: insufficient data [H]. Action: trim transfer state to what hydration needs. Verify: HTML size, Lighthouse ×3 median. Confidence: high (size), unknown (ranking effect).

**TS-15 · P2 · Programme "A continuación" shows past airings** — Evidence [V]: `/programas/espejo-pblico` at 12:40 on 20 Oct lists "En tierra lejana · 19 oct, 23:00 – 20 oct, 02:15" and other overnight items under "A continuación". Action: filter by `start >= now`. Confidence: high.

**TS-16 · P2 · Raw EPG tokens and thin regional channel pages** — Evidence [V]: visible "(Información,Magacín)", "MASTERCHEF (?)", "Emisión sin identificar", "Acceso sin confirmar", English "LIVE" badges; `/canales/la-1-catalunya` 175 words, 1 airing; 7 channel pages under 250 words. Action: format categories, hide unknowns, noindex channels with no schedule for the next 24 h. Confidence: high.

**TS-17 · P3 · `/guias/categoria/rankings` duplicates `/guias/rankings`** — Evidence [V]: both indexable and in the sitemap; copy "Rankings de Rankings", "recomendaciones editoriales sobre Rankings". Action: 301 the category to `/guias/rankings`, fix template copy. Confidence: high.

**TS-18 · P3 · Minor** — [V] `sitemap-streaming.xml` is still submitted in GSC (4 URLs already in the static sitemap); football slugify turns "Bodø" into `bod` (`FootballNormalizer.ts:59`, NFD doesn't decompose ø); 404 pages emit a self-canonical; 85 descriptions under 100 characters (mostly templated channel pages).

**Verified OK [V]:** robots.txt (private routes disallowed, legacy routes crawlable, sitemap declared); HTTP→HTTPS and www→apex 301; all `redirect-map.csv` entries probed are single-hop 301 (`/editorial`, `/blog`, `/editorial/<old slug>` → final target, `/canales/la_1`, `/programacion-tv/guia-canales`, `/deportes/futbol/en-directo`); `?utm_source` and `?dia=` canonicalise to the clean URL; 404 + noindex for unknown channel/programme/film/guide/top-level; `ads.txt` present; `google-adsense-account` meta; Article + BreadcrumbList on all 10 posts; SSR resilience 11/11.

## E. Route inventory (public, from `app.routes.ts`, `football.routes.ts`, sitemaps, probes)

| Family | Example | Count / sitemap | Index | Intent / unique value | Action |
|---|---|---|---|---|---|
| Home | `/` | 1 / static | yes | "guía tv hoy" — live grid | **improve** (TS-14, IA-01) |
| TV now | `/programacion-tv/en-directo` | 1 / static | yes | what's on now, all channels; 2,069 words | keep |
| What to watch | `/programacion-tv/que-ver-hoy` | 1 / static | yes | curated tonight | keep; differentiate from home |
| Films / series hubs | `/programacion-tv/peliculas`, `/series` | 2 / static | yes | films/series on TV today | keep |
| Channels directory | `/canales` | 1 / static | yes | 7,834 words, no JSON-LD | keep; add ItemList |
| Channel pages | `/canales/<id>` | 76 / channels | yes | "programación La 1" | **improve** (TS-06, TS-16) |
| Programme pages | `/programas/<slug>` | 193 rotating / programs | yes while airing, 404 after | "cuándo echan X" | **re-architect** (TS-01–03) |
| Series / films detail | `/series/<slug>`, `/peliculas/<slug>` | not in sitemap | series index; films mostly noindex (thin policy) | duplicates of programmes | **consolidate** (TS-02) |
| Legacy catalogue | `/contenido/*`, `/detalles/*`, `/pelicula-details/*`, `/program-full-details/*`, `/ver-canal/*` | — | 301 or noindex | legacy | keep redirects |
| Platforms | `/plataformas`, `/comparador-streaming` | 2 / static | yes | catalogue + plan comparator | keep; comparator is a differentiator |
| Football hubs | `/deportes/futbol`, `/partidos-hoy`, `/competiciones`, `/noticias` | 4 / static | yes | today's matches + broadcaster | keep; fix TS-06/10 |
| Football detail | `/competiciones/<slug>`, `/equipos/<slug>`, `/partido/<slug>`, `/calendario` | not in sitemap | yes | where to watch a match | **improve + add to sitemap** (TS-09, TS-12) |
| Football guide duplicates | `/deportes/futbol/noticias/<slug>` | — | yes | duplicate of `/guias` | **redirect** (TS-04) |
| Guides | `/guias`, `/guias/<slug>`, `/guias/rankings`, `/guias/categoria/<slug>` | 14 / blog | yes | original content | keep; merge category/rankings (TS-17) |
| Trends | `/tendencias` | not in sitemap | yes | empty | **noindex or SSR** (TS-05) |
| Developer / embed | `/developers`, `/embed`, `/embed/programacion` | 2 / static | yes / widget 503 | B2B, backlinks | **fix widget** (TS-07) |
| Trust / legal | `/sobre-nosotros`, `/prensa`, `/politica-editorial`, `/avisolegal`, `/privacidad`, `/cookies`, `/terminos`, `/accesibilidad` | 8 / static | yes | trust | **update content** (AD-02, AD-03) |
| HTML sitemap | `/sitemap` | — | noindex, follow | navigation | keep |
| Account / private | `/perfil`, `/para-ti`, `/comunidad`, `/admin`, `/iniciar-sesion`, `/registro`, `/mi-cuenta` | — | noindex (some robots-disallowed) | — | keep; never place ads |
| Public profiles | `/perfil/<userId>` | — | 404 for unknown | UGC | keep noindex unless moderated |

## F. Navigation and IA findings

**IA-01 · P2 · Home's first screen is a single-programme carousel** — [V] screenshots 390 px and 1440 px: the hero (one programme, "Mañaneros 360 T3") fills the first mobile viewport; the H1 and the "what's on now per channel" grid start below the fold. Intent "guía tv hoy" expects a channel×time grid. Action: H1 + compact now/next grid by channel above the fold; carousel lower or removed. Verify: first viewport at 390 px shows ≥ 5 channels with current programme. Confidence: medium (UX judgement).

**IA-02 · P2 · Channel directory not in the main nav** — [V] header: TV · Qué ver · Plataformas · Fútbol · Guías; footer has no `/canales` and no `/programacion-tv/peliculas`; `/canales` is reachable from the home body and breadcrumbs. "programación <canal>" is the core TV-guide query family. Action: add "Canales" to header/footer. Confidence: high.

**IA-03 · P3 · Inconsistent naming** — [V] header "TV" vs footer "TV en directo" vs `route-map.ts` PRIMARY_NAV_ROUTES "Guía TV"/"Explorar" (unused labels); brand appears as "GUÍA TV", "Guía TV", "Guía Programación TV" and "GPTV" (legal pages); header tagline uses jargon ("discovery editorial"). Action: one brand name and one label per destination. Confidence: high.

**IA-04 · P3 · Footer links to empty or private surfaces** — [V] `/tendencias` (empty), `/perfil`, `/iniciar-sesion`, `/registro` in every footer. Action: drop account links from the footer (header has "Acceder"). Confidence: medium.

Internal linking [V]: home has 84 unique internal links; channel cards and programme cards link correctly with descriptive anchors; guides link to live pages (4–5 internal links each). No orphan sitemap URL was found in the probed sample. Orphan *from sitemap* (linked but unlisted): football competitions/teams/calendar (TS-12).

## G. Editorial corpus

Actual public corpus [V] (`/v2/blog?limit=0` + `npm run seo:editorial-audit`, 20 Oct): **10 posts**, all `origin: ai-assisted`, author "Equipo editorial Guía TV", `reviewedBy: Arturo Baroja`, published/modified 19–20 Oct 2026. Repo gate: **0 blocking**, 9 warnings "short for non-human origin" (314–483 words; the gate's AI floor is 600), 5 near-duplicates (Jaccard 0.36–0.48).

| Post | Words | Ext. sources | Assessment |
|---|---:|---:|---|
| `donde-ver-champions-league-2026-27-espana` | 314 | 4 | Accurate on spot-check (UEFA lists Telefónica; final on Sat 5 Jun 2027 at the Metropolitano, consistent with the calendar); one press source (Qué!) for Orange, flagged as such. Short; no matchday broadcaster table though the site has the data. |
| `donde-ver-laliga-2026-27-espana` | 368 | 5 | Same pattern. |
| `movistar-plus-vs-dazn` | 483 | 5 | Sourced; DAZN prices omitted deliberately [H]. |
| `precios-plataformas-streaming-espana` | 433 | 7 | Dated prices from official pages [H]; title carries "(octubre 2026)", so it needs a monthly refresh. Prices not re-verified this session [U]. |
| `netflix-hbo-max-disney-prime-video-que-plan-elegir` | 649 | 5 | The best piece: computed cost comparison. |
| `mejores-series-y-peliculas-{netflix,prime-video,disney-plus,hbo-max,movistar-plus}-espana` | 440–475 | 1 (TMDB) | Transparent method, but the ranking is a sort of TMDB user ratings: little original judgement, five near-identical templates, dated titles. |

**ED-01 · P1 · Review attribution vs process** — Evidence [H]: SEO-MASTER-REPORT records the reviewer of record "delegated verification to Claude"; [V] each post says "Revisión editorial: Arturo Baroja" and `/politica-editorial` states a person must review. If no human actually checked the facts, the byline overstates the review. Action (owner): either the named person reviews and the approval records it, or the wording becomes "Elaborado con IA y verificado contra las fuentes citadas el …" without implying human review. Benefit: trust, E-E-A-T and AdSense/Search honesty. Confidence: high that it's a decision point; the facts of the process are the owner's to state.

**ED-02 · P2 · Rankings add little beyond TMDB** — Action: one ranking hub with platform filter and original curation (new this month, leaving soon, Spanish productions, what's on free TV this week), or keep the five but add judgement text per title; refresh monthly or drop the month from titles.

**ED-03 · P2 · Football guides don't use the site's own data** — Action: embed the next matchdays with kickoff and broadcaster (from the fixtures feed) so the guide answers "dónde ver el próximo partido de X".

**ED-04 · P2 · No refresh process for dated content** — the previous corpus failed exactly here (14 stale posts [H]). Action: `evergreen=false` posts get a review-by date; the gate flags overdue posts.

Content gaps for Spanish users (demand label: **[M]** measured in GSC, **[Hyp]** hypothesis):

| Cluster | Gap | Demand |
|---|---|---|
| Daily TV guide | persistent "programación de hoy" per channel with tonight's prime time summary | [M] generic "guía tv (hoy)" queries; "guia tv imagenio" |
| TDT schedules | "qué echan esta noche en TDT" (prime time digest, all channels) | [Hyp] |
| Films on TV | "películas hoy en TV / esta noche / fin de semana en abierto" | [Hyp] |
| Series | persistent series pages: next airings + streaming platform | [M] (programme URLs historically had impressions) |
| Football broadcasts | "partidos de hoy en TV", "fútbol en la tele hoy y mañana", "partidos LaLiga hoy horarios", per-match "dónde ver X – Y" | **[M]** — the only queries that produced clicks |
| Competitions | "dónde ver Champions/LaLiga/Copa del Rey/Premier en España" with live fixture tables | [M partially] / [Hyp] |
| Streaming | price tracker with change history; "qué llega a Netflix/Prime/… este mes"; "se va de Netflix" | [Hyp] |
| Platform comparison | plan picker (exists) + bundles (Movistar/Orange/Vodafone with Netflix etc.) | [Hyp] |
| Practical | how to tune TDT channels, Movistar dial numbers, how to watch RTVE Play/Atresplayer abroad (legal) | [Hyp] |

## H. Search Console

Access [V]: authorised, read-only Search Console API through the server's existing service account (`siteOwner` on `sc-domain:guiaprogramaciontv.com`), data through 17 Oct 2026. Exact numbers are in the private appendix, not here.

- Equal 28-day and 90-day windows compared. Organic clicks are near zero in every window since June 2025; impressions are low hundreds per 90 days.
- The large majority of 90-day impressions are the home page on generic queries ("guia tv", "guia tv hoy", "guía de tv", "guia tv imagenio") at average positions ~40–60, all with 0 clicks; those stop on **1 Sep 2026** (abrupt, daily data). Cause unproven [H, unchanged].
- The last 28 days show only football long-tail queries (positions 13–63), the source of every recent click, landing on `/deportes/futbol`. The higher average position in that window is a change of query mix, not recovery.
- No query maps to more than one URL in the 90-day query×page data: **no measured cannibalisation**. Overlap between `/`, `/en-directo` and `/que-ver-hoy` is a hypothesis.
- Sitemaps: index 306 URLs, 0 errors, downloaded 20 Oct after the automatic submit; `sitemap-streaming.xml` still submitted separately.
- Index coverage isn't available through the API; the last UI snapshot (12 Oct, pre-restructure) is in the private folder: the "not found" bucket is dominated by expired programme URLs (TS-01).
- Missing for a fuller analysis: URL Inspection per template (API exists, quota-limited; not run), a fresh UI index-coverage export after the 20 Oct restructure (needs the owner's browser session).

## I. AdSense readiness — **NO-GO**

Policy basis: AdSense Program policies (inventory value), Google Publisher Policies, EU user consent policy, Search spam policies (scaled content, link spam). These were not re-fetched this session; the 19 Oct fetch is cited in `03-ADSENSE-READINESS.md` [H]. No word or article minimums are assumed.

Actual policy issues:

**AD-01 · P1 · No consent management for EEA ads** — [V] no CMP script/banner in the HTML or source (`grep` for consent/CMP/gtag/adsbygoogle: none). Google requires a Google-certified CMP to serve ads to EEA/UK users [knowledge, not re-fetched]. Action: integrate a certified CMP (Google's own Privacy & messaging is free) before any ad code. Verify: banner on first visit from an EU IP, TCF string present.

**AD-02 · P1 · Cookie policy doesn't match reality** — [V] `/cookies` ("Última actualización: Diciembre 2024") lists `gptv_session`, `gptv_prefs`, `_ga`, `cookie_consent`; the site loads no Google Analytics and has no consent cookie; theme preference is in `localStorage`. Action: rewrite from an actual cookie and storage inventory, and again once ads and the CMP are added.

**AD-03 · P2 · Legal notice details** — [V] `/avisolegal` domicile "Travesía de Espiñeiro 1, 55, España" lacks postal code and municipality (LSSI art. 10 asks for a full address [knowledge]); "Última actualización: Agosto 2026" although edited 19 Oct. Owner to supply the data.

**AD-04 · P1 · Indexable low-value or empty screens** — `/tendencias` (TS-05), "Partido no encontrado" pages linked internally (TS-09), channels with one unknown airing (TS-16), the widget 503 (TS-07). Action: fix or noindex, and gate any future ad slot on "route has data" (never on empty/error/noindex/account pages).

**AD-05 · P1 · Original publisher content is thin and very new** — 10 AI-assisted posts, one day old, half templated (G). Everything else is EPG/TMDB-derived (useful but formulaic). This is the "low value content" risk the site was rejected for [H]. Action: Phase 2 content work plus the ED-01 decision; wait for indexing before reapplying.

**AD-06 · P1 · Affiliate link labelling** — TS-08. Affiliate disclosure component exists (`app-affiliate-disclosure`) and shows only for sponsored offers [V code].

Optional improvements (not policy blockers): mobile overflow (TS-06), home above-the-fold (IA-01), brand consistency (IA-03).

Re-review checklist: AD-01…AD-06 closed; `seo:crawl` clean; no indexable empty screen; ED-01 resolved; corpus indexed in GSC.

## J. Opportunities and clusters (prioritised)

1. **Persistent programme/series pages** (TS-01–03): turns 300+ dying URLs into lasting "cuándo echan X / dónde ver X" pages; largest structural upside [Hyp on demand, M on historical impressions].
2. **Football "dónde ver" layer**: competition pages in the sitemap, per-match pages with broadcaster and Movistar dial, Madrid-time correctness, "hoy y mañana" view [M].
3. **Prime-time digest** ("Qué ver esta noche en TV"): one daily SSR page from EPG data with a short editorial pick [Hyp].
4. **Films on free TV this week** [Hyp].
5. **Working widget** (TS-07): free distribution and natural links [Hyp].
6. **Streaming price tracker** with change history (extends the prices guide; unique if maintained) [Hyp].
7. **Monthly "novedades" per platform** replacing static TMDB-rating rankings [Hyp].
8. **Channel page enrichment** (dial numbers per operator, HD/TDT availability, weekly schedule) [Hyp].
9. **Home above-the-fold grid** (IA-01) [UX].
10. **Practical evergreen guides** (resintonizar TDT, ver TDT sin antena, legal free streaming of RTVE/Atresplayer) [Hyp].

Competitive context (from general knowledge, **not researched this session** [U]): Spanish TV guides (e.g. programacion-tv.elpais.com, FormulaTV, SincroGuía, Movistar Plus+ guide) offer per-channel schedules with persistent programme pages; football listings sites (e.g. futbolenlatv.es) dominate "partidos hoy en TV"; JustWatch dominates streaming availability. GuíaTV's possible differentiation is joining the three in one answer ("X tonight: on TV at 22:00 on La 1, or on Netflix") and the comparator and widget. Verify with a SERP review before committing effort.

## K. Risk register

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Programme URL re-architecture creates redirect chains or mass 404s | medium | high | full old→new map from logs/GSC; single-hop 301; crawl before/after |
| R-02 | Changing slug function silently changes existing URLs | high if done alone | high | only together with TS-01/02 plus 301s; snapshot test of slug outputs |
| R-03 | Renamed `/guias` URLs fluctuate for weeks | expected | low (tiny traffic) | monitor; no further renames |
| R-04 | Empty provider answer cached as real (football) [H] | medium | medium | 1-min empty cache exists; alert on empty days |
| R-05 | MongoDB pool exhaustion / SSR timeouts recur [H] | medium | high (5xx to crawlers) | instrument pool, log SSR timeouts per route |
| R-06 | Dated guides go stale ("octubre 2026") | high | medium | review-by dates in the gate |
| R-07 | Review attribution challenged (ED-01) | medium | high (trust/policy) | owner decision before more publishing |
| R-08 | Adding ads before CMP | — | policy violation | CMP first, ads gated by route state |
| R-09 | Auctorio pipeline re-enabled to autopilot [H] | low | high | keep assisted mode; gate rejects bot reviewers |
| R-10 | Search Console automation submitting broken sitemaps | low | medium | deploy smoke checks; crawl in CI |

## L. Phase 2 recommendations

### 1. Ten most important confirmed problems
1. TS-01 programme URLs 404 when out of the EPG window
2. TS-02 duplicate entity URLs (`/series`, `/programas`, season suffixes)
3. TS-03 accent-dropping slugs
4. AD-01 no CMP / AD-02 inaccurate cookie policy
5. ED-01 review attribution vs actual process
6. TS-04 football guide duplicates
7. TS-06 mobile horizontal overflow (football list, channel pages)
8. TS-05 `/tendencias` indexable loading screen
9. TS-07 widget 503 + `SAMEORIGIN`
10. TS-08 affiliate links without `rel="sponsored"`

### 2. Ten highest-value opportunities
See J (1–10).

### 3. Proposed backlog (order)
1. Quick fixes, one PR: TS-04, TS-05, TS-10, TS-11, TS-17, TS-08, TS-07, TS-13, TS-09 schema and date bug, TS-15.
2. Mobile overflow fixes plus an e2e overflow guard (TS-06).
3. Legal and consent: AD-02/AD-03 copy (owner data), CMP selection (owner), no ad code yet.
4. Design doc, then implement the persistent programme entity: TS-01/02/03 with the redirect map (largest change; needs a dedicated plan and owner sign-off).
5. Football: competitions and calendar in the sitemap, match lifecycle policy (TS-12, TS-09).
6. Home above-the-fold and channel nav (IA-01, IA-02, IA-03).
7. Editorial: ED-01 decision → ED-03 → ED-02 → ED-04; new cluster pieces only after.
8. Transfer-state trim (TS-14), then a 3-run Lighthouse median.

### 4. Unresolved questions (owner)
1. ED-01: did a human verify the 10 posts? Which attribution wording should be used?
2. Programme model: keep `/programas/` as the canonical prefix for series and shows, or split `/series/` (persistent) and `/programas/` (shows)?
3. Is the embeddable widget a product to keep? If yes, allow framing from any origin?
4. Which CMP (Google Privacy & messaging vs third party)? Will ads be personalised?
5. Full postal address for `/avisolegal`.
6. Should past football matches stay indexable (result pages) or be noindexed after N days?
7. Are the `/v2/affiliate/go` offers on the home commission-bearing (Amazon tag)?
8. Approval to run `claude-seo setup` (local Python/Chromium) — optional.

### 5. Skills for Phase 2 (session started in `guiatv-frontend/`)
- `mk-site-architecture` + `mk-programmatic-seo` — programme entity model, URL and redirect design (TS-01–03, TS-12).
- `seo-technical` + `seo-sitemap` — sitemap and lastmod rules, redirects, crawl verification.
- `seo-schema` (or `mk-schema`, not both) — BroadcastEvent `@context`, breadcrumbs, ItemList on `/canales`.
- `mk-content-strategy` + `seo-content-brief` — cluster briefs (no DataForSEO).
- `seo-content` + `mk-copy-editing` — editorial pass after ED-01.
- `seo-google` only if the Python runtime is set up; otherwise the repo `gsc-compare.mjs` + the server service account.
- Repo scripts remain the regression gates.

### 6. Tests after Phase 2
- `npm run seo:crawl` on production: 0 issues; plus probes for every changed or redirected URL (single-hop 301, final 200, self-canonical).
- New probe set: `/series/x` ↔ `/programas/x` single canonical; programme outside the EPG window → 200 with content (or 410 for one-offs); accented legacy slug → 301.
- `npm run seo:ssr-resilience` (add `/embed/programacion` → 200 noindex, `/tendencias`).
- `npm run seo:editorial-audit`: 0 blocking; no overdue review dates.
- Playwright: horizontal overflow = 0 at 360/390 px for one URL per template; widget iframe from a different origin renders.
- Unit tests: match-slug date across midnight (Europe/Madrid); slug transliteration snapshot; sitemap lastmod never in the future; affiliate links always `rel` contains `sponsored`.
- `curl -I`: `/deportes` 301; `/embed/programacion` without `X-Frame-Options`, with `frame-ancestors`.
- Google Rich Results Test: a match page, a guide, `/canales`.
- Lighthouse mobile ×3 median on home and a channel page (lab only; field CWV still insufficient).
- Search Console: same 28-day windows from 16 Nov 2026 (private), "not found" trend, sitemap processed counts.
- Backend and frontend unit suites, lint, SSR build.
