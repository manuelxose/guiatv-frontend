# GuíaTV — Phase 2B implementation report: responsive UX/UI repair (2026-10-20)

## A. Baseline and Git

- Branch `fix/ux-mobile-phase-2b` from `main` @ `654cc4e` (the Phase 2A merge, production release `20261020135259`). **Not merged, not deployed.**
- Commits: `ba038cf` (fixes, spec), `6bba284` (test fixes, H1 on the match not-found state), `b94af9d` (match H1, iframe test host), `6266a27` (focusable scroll regions on `/embed`), `a87c0b9` (widget time colour, date-strip wrap), plus this report.
- "Before" values come from production. "After" values come from this branch's production SSR build, run locally against the production API (`API_ORIGIN=https://guiaprogramaciontv.com`). None of the "after" values describe production.
- Environment note: WSL's 6 GB limit was exhausted by the editor and other sessions, and `ng build` was OOM-killed (exit 137) from the fourth attempt on. The final builds, Karma, Playwright and the SEO scripts ran from a clean clone of the branch on the Windows host (`%TEMP%\guiatv-2b`, Node 24.18). The backend tests and ESLint ran in WSL.
- The untracked `docs/seo/PHASE-1-AUDIT-2026-10-20.md` was left untouched.

## B. Skills

- **Invoked:** `seo-technical`, for the regression checklist: indexability, canonical, robots, redirects, structured data, mobile/desktop parity and framing headers.
- **Read and applied by hand:** `seo-page` (image dimensions and CLS checks). The project skills became invocable only partway through the session.
- **Ponytail** is the user's global working mode (`~/.claude/CLAUDE.md`), not an installed skill. It was applied: root-cause fixes, the smallest diff, no new dependencies.
- **Not available:** no accessibility, responsive-design or Playwright skill is installed. The existing tools were used instead: `@axe-core/playwright` (already a devDependency), Playwright and Karma.
- Nothing was added to the project. Lighthouse 12.8.2 was installed into a temporary folder outside the repo (`%TEMP%\lh`), not into `package.json`. Results are in §I.

## C. Responsive audit matrix

Each cell is the horizontal document overflow in px (`scrollWidth − innerWidth`), measured on the rendered DOM. Each URL was loaded fresh at each width, with `locale es-ES` and `Europe/Madrid`.

| Template | URL | Before (production) 320/360/375/390/428/768/1024/1440 | After (candidate) |
|---|---|---|---|
| Home | `/` | 0 everywhere | 0 |
| TV guide | `/programacion-tv/en-directo` | 0 | 0 |
| Channel directory | `/canales` | 0 | 0 |
| Channel | `/canales/la-1` | **615/575/560/545/507/245**/0/0 | 0 |
| Regional channel | `/canales/tv3` | **615/575/560/545/507/245**/0/0 | 0 |
| Sparse regional channel | `/canales/etbon-oca1-tv` | **615/575/560/545/507/245**/0/0 | 0 |
| Programme | `/programas/the-last-ship` | 0 | 0 |
| Series | `/series/los-simpson` | 0 | 0 |
| Film | `/peliculas/imparable` | 0 | 0 |
| What to watch | `/programacion-tv/que-ver-hoy` | 0 | 0 |
| Platforms | `/plataformas` | 0 (one load returned 503, see K) | 0 |
| Comparator | `/comparador-streaming` | 0 | 0 |
| Football hub | `/deportes/futbol` | 0 | 0 |
| Today's matches | `/deportes/futbol/partidos-hoy` | **291/251/236/221/183**/0/0/0; H1 clipped ≤ 428 | 0, H1 whole |
| Competition | `/deportes/futbol/competiciones/uefa-champions-league` | 0 | 0 |
| Match | `/deportes/futbol/partido/…-2026-10-20` | 0; **no H1** | 0, H1 |
| Guides hub | `/guias` | 0 | 0 |
| Guide | `/guias/precios-plataformas-streaming-espana` | 0 | 0 |
| Rankings | `/guias/rankings` | 0 | 0 |
| Trends | `/tendencias` | 0; **H1 clipped (564 px wide) ≤ 428** | 0, H1 whole |
| Embed landing | `/embed` | **1013/973/958/943/905/573**/0/0 | 0 |
| Widget | `/embed/programacion` | 0; **raw ISO times, 00:00 slot** | 0, `HH:mm`, "Ahora" |
| Legal | `/avisolegal` | **2**/0… | 0 |
| Other static pages | `/privacidad`, `/cookies`, `/terminos`, `/sobre-nosotros`, `/prensa`, `/politica-editorial`, `/developers` | 0 | 0 |
| Accessibility statement | `/accesibilidad` | **5** at 320 (candidate before its fix) | 0 |

Elements that extend past the viewport inside an intended scroller (rails, chips, code blocks, the parameter table, the context-nav track) are not counted. They scroll inside their own container.

## D. Issues: root cause, fix, verification

| # | Route / viewport | Root cause | Source | Fix | Before → after | Verified |
|---|---|---|---|---|---|---|
| 1 | `/canales/*`, ≤ 768 | The cards in the "A continuación" and "Canales relacionados" rails contain a Tailwind `.sr-only` span (`position: absolute`, 1 px). The rails are `overflow-x: auto` but not positioned, so the span's containing block is the shell's `.portal-shell__body-with-rail` (`position: relative`). The span escapes both the scroller and the shell's `overflow-x: clip`, and sits at its static position on the 3rd–4th card (right = 935 px). | `pages/canal-completo/canal-completo.component.scss` | `.rail-scroll { position: relative }`, which makes the rail the containing block. No overflow is suppressed, and the rails still scroll. | +545 → 0 (390); every channel type, 320–768 | Playwright, audit |
| 2 | `/deportes/futbol/partidos-hoy`, ≤ 428 | The shell's content grid had an implicit `auto` track, which grows to the routed page's min-content width (the nowrap date strip, 751 px at 390). The shell's `overflow-x: clip` then hid the H1 end, the intro, the filters and the date picker. The picker's own `.sr-only` sat at 611 px, which produced the +221 px document scroll. The same mechanism clipped the `/tendencias` H1 (564 px). | `components/app-public-layout-shell/app-public-layout-shell.component.scss` | `grid-template-columns: minmax(0, 1fr)`, applied once for every routed page. The channel page had already patched this locally. | +221 → 0; H1 is whole on football and trends | Playwright, audit, screenshots |
| 2b | same, 390 | Once the page had the right width, the native date input (about 130 px) squeezed the day scroller to about 70 px, and "Hoy" went out of view. | `features/football/components/football-date-strip/…ts` | `flex-wrap: wrap` plus `flex: 1 1 14rem` on the days, so on phones the picker takes its own row. | "dom 18 Ay…" → "dom 18 · Ayer · **Hoy** · Maña…" | screenshot |
| 3 | `/embed`, ≤ 768 | Same `auto` track problem on its own grid: the `<pre>` snippets were 1317 px wide. | `pages/embed-page/embed-page.component.html` | `grid-cols-[minmax(0,1fr)]` base track. | +943 → 0 | audit, Playwright |
| 3b | `/embed` | Once the code blocks scrolled, axe flagged `scrollable-region-focusable` ×5 (a new violation caused by fix 3). | same | `tabindex="0"` plus an accessible name on the 3 `<pre>` and the table wrapper (`role="region"`). | 5 → 0 | axe |
| 4 | `/avisolegal` 320, `/accesibilidad` 320 | Unbreakable e-mail addresses inside flex rows. | `pages/legal/legal-notice/…html`, `pages/legal/accessibility/…html` | `min-w-0` plus `overflow-wrap:anywhere`; icons `flex-none`. | +2 / +5 → 0 | audit |
| 5 | Widget, any width | (a) `Number(null) === 0`: without `?timeSlot`, both the embed component and the facade normalised the absent value to slot `"0"`, so the widget always opened on 00:00–03:00. (b) The current slot used `getHours()` in the viewer's time zone. (c) The template printed `visibleStartTime` and `prog.start` raw, and they are ISO instants. (d) In the light theme, `.tv-program__hour` kept the dark theme's `#fff`, which made the times nearly invisible. | `pages/embed-page/embed-program-guide.component.ts`, `services/program-list/program-list-facade.service.ts`, `components/program-list/program-list.component.{ts,html,scss}` | (a) An absent value is treated as null. (b) The slot and the slot reference instant are computed from `madridMinutesSinceMidnight` (existing helper), correct for CET and CEST. (c) `clockTime()` uses the existing `formatMadridHM`. (d) Light-theme colour for the hour. Embed mode now starts on "Ahora" like the main guide; manual slot and day navigation is unchanged and `?timeSlot=N` is still honoured. The chips gained `type="button"` and `aria-expanded`. | 14:07 Madrid: "00:00 - 03:00", `2026-10-19T21:00:00.000Z` → "Ahora", `15:50`, `17:45` | unit spec, Playwright inside a real cross-origin iframe, screenshot |
| 6 | Match page, all widths | The page had no `<h1>`, in either the found or the not-found state. | `features/football/pages/football-match-detail/…html/.scss` | Visible `<h1>Local - Visitante</h1>` above the scoreboard (team names already on the page and in the `<title>`). The not-found title `<p>` became an `<h1>`. | no H1 → H1 | Playwright |

`app-program-list` is only used by the widget (home and the guide use `epg-grid`), so fix 5 cannot change those grids. This was confirmed by searching the code and by 0 `app-program-list` elements on `/` and `/programacion-tv/en-directo`.

**Navigation (§7):** no defect found. On ≤ 428 px the bottom tab bar and the "Más" sheet open and close (`aria-expanded` toggles), every target fits the viewport, and every target is at least 24 px. On ≥ 768 px the section tabs behave the same. The header, search, account, theme, footer, chat button and floating button showed no overflow or broken interaction at any width.

## E. Files modified

- **Shell and pages:**
  - `app-public-layout-shell.component.scss`
  - `canal-completo.component.scss`
  - `embed-page.component.html`
  - `legal-notice.component.html`
  - `accessibility.component.html`
  - `football-match-detail.component.{html,scss}`
  - `football-date-strip.component.ts`
- **Widget:**
  - `program-list.component.{ts,html,scss}`
  - `program-list-facade.service.ts` (+ new `program-list-facade.service.spec.ts`)
  - `embed-program-guide.component.ts`
- **Tests:**
  - `e2e/specs/responsive.spec.ts` (new)
  - `playwright.config.ts`: `E2E_BASE_URL` runs the suite against a running origin and skips the dev server, backend and warm-up.
- **Docs:** this report, plus `docs/seo/phase-2b/*.png`.

No backend file was changed. No dependency was added.

## F. Before/after screenshots (390 px; widget in a 380 px cross-origin iframe)

`docs/seo/phase-2b/`:
- `channel-390-{before,after}.png`
- `football-today-390-…`
- `embed-390-…`
- `trends-390-…`
- `football-match-390-…`
- `widget-iframe-380-…`

The channel overflow is below the first screen, so its two images look alike; the measurements in C are the evidence for that one.

## G. Accessibility (axe-core, WCAG 2.0/2.1/2.2 A+AA tags, 390 px)

| Page | Before (production) | After (candidate) |
|---|---|---|
| `/` | serious color-contrast ×9 | not re-run (no change on this page) |
| `/canales/la-1` | serious color-contrast ×39 (morning), ×69 (afternoon) | ×69 — the same count on production at the same moment, so the difference comes from the data |
| `/deportes/futbol/partidos-hoy` | color-contrast ×2 | ×2 |
| `/tendencias` | color-contrast ×3 | ×3 |
| `/guias/precios-…` | color-contrast ×1 | not re-run (no change on this page) |
| `/embed` | color-contrast ×14 | **0** (fix 3b removed the one new violation, `scrollable-region-focusable`) |
| `/embed/programacion` | none | none |
| Match page | — | color-contrast ×4 |

- **Confirmed violations, pre-existing and not fixed:** color-contrast only, in the light theme. Examples measured on `/canales/la-1`:
  - `--accent-live #f3727f` used as text on white: 2.6–2.8:1
  - soft text `#acacac` on `#fdfdfd`: 2.2:1
  - `#7c7c7c` (past schedule rows): 3.8–4.1:1
  - `#929292` buttons: 3.05:1

  This needs a design-token change across the site, so it is left for an explicit decision.
- **No critical violations,** before or after.
- **Fixed in 2B:**
  - match pages had no H1
  - widget times were nearly invisible in the light theme
  - widget chips had no state (`aria-expanded`)
  - `/embed` scroll regions were not focusable
- **Advisory:** pages have 3–20 targets under 24 px at 390 px, mostly inline text links inside paragraphs (exempt under 2.5.8) and breadcrumb links. Primary navigation passes.

## H. Playwright

`e2e/specs/responsive.spec.ts`, run against the candidate with 2 workers: **183 passed, 0 failed, 0 skipped.**

- **Per template and width (22 templates × 8 widths):**
  - document overflow ≤ 0, with the offending elements named in the failure message
  - H1 visible, inside the viewport, not clipped
  - no raw ISO timestamps
  - no uncaught page errors
  - no same-origin GET 5xx
  - Data-dependent templates (programme, series, film, competition, match, guide) take their URL from their listing page at run time, with no hard-coded titles. A linked page that renders "no encontrado" fails the test.
- **Navigation at 320/390/768/1440:** the visible primary navigation; the "Más" sheet opens and closes; every target fits and is at least 24 px.
- **Widget in a real cross-origin iframe at 320 and 420:**
  - The host page is served by a loopback server on another port, because a route-fulfilled host trips Chromium's Local Network Access check (`ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS`).
  - Assertions: every time is `HH:mm`, the widget opens on "Ahora", no overflow.
  - `?timeSlot=0` is honoured and the slot sheet works (`aria-expanded`).
- **Failures that are not hidden:**
  - A 503 document fails with "API unavailable".
  - Speculation-rules prefetches (`sec-purpose: prefetch`) are ignored: Cloudflare refuses them with 503 and `cf-speculation-refused`, and the real request follows.
  - Non-GET 5xx are recorded as test annotations. The local candidate's 127.0.0.1 origin is not on the API's CORS allow-list, and the CORS middleware then answers 500 for the telemetry and `/v2/affiliate/resolve` POSTs (see K).
- **Earlier runs** surfaced real defects that are now fixed: the match page had no H1; the mobile navigation test had targeted the wrong control.

The existing suites were not re-run. Phase 2A recorded their baseline (17 pass / 16 fail, identical on `main`, caused by the stale local DB).

## I. Unit, lint, build

| Check | Result |
|---|---|
| Frontend Karma | **266/266** (Phase 2A: 264). The 2 new specs: Madrid slot for CEST, CET and the DST night; absent `?timeSlot` is null and not slot 0 |
| Backend `npm test` | 360 pass, 0 fail, 1 skip (Redis, environmental), identical to 2A. The backend was not changed |
| ESLint, changed files | 0 errors. The warnings are existing `prefer-inject`/`any` |
| SSR production build | OK. Initial bundle 1.10 MB raw / 258.87 kB transfer, against 258.19 kB for `main` built the same way (+0.68 kB). No new dependency |

### Lighthouse (lab data, not field data)

Setup: Lighthouse 12.8.2, mobile default profile (simulated Moto G Power, 4G throttling), headless Chromium, Windows host. Each value is the median of 3 or 5 runs. These are lab measurements; field Core Web Vitals (CrUX) don't have enough data for this site (Phase 1).

**Like for like: the same local SSR setup for both builds, 5 runs each.** Both builds ran side by side from `%TEMP%`, served by `ssr-server.mjs` against the production API.

| URL | Build | Perf (5 runs) | LCP | FCP | TBT | CLS | A11y / SEO / BP |
|---|---|---|---|---|---|---|---|
| `/` | main | 67 (68,68,67,67,67) | 5.88 s | 3.60 s | 194 ms | 0.026 | 96 / 100 / 96 |
| `/` | 2B | 68 (68,67,69,69,67) | 5.46 s | 3.62 s | 195 ms | 0.026 | 96 / 100 / 96 |
| `/canales/la-1` | main | 67 | 7.28 s | 3.47 s | 135 ms | 0.002 | 96 / 100 / 96 |
| `/canales/la-1` | 2B | 68 | 7.09 s | 3.40 s | 133 ms | 0.003 | 96 / 100 / 96 |
| `/deportes/futbol/partidos-hoy` | main | 81 (×5) | 3.92 s | 3.24 s | 25 ms | 0.016 | 96 / 100 / 96 |
| `/deportes/futbol/partidos-hoy` | 2B | 80 (×5) | 4.21 s | 3.18 s | 28 ms | 0.015 | 96 / 100 / 96 |

- **`/` and channel:** no regression; the differences are within run-to-run noise.
- **Football:** −1 point and +0.29 s LCP, consistent across all 5 runs.
  - The LCP element in both builds is the intro paragraph (`.head__sub`). On `main` the page was 751 px wide and the shell clipped that paragraph. In 2B it shows in full over more lines, so the element painted is larger.
  - This cost comes from showing the content that had been cut off; it is not a slowdown. CLS improved slightly.

**Production (Cloudflare + nginx) against the local candidate, 3 runs, for context only:**
- `/`: 70 / LCP 5.29 s vs 64 / 6.42 s
- channel: 66 / 8.44 s vs 68 / 7.09 s
- football: 80 / 4.01 s vs 80 / 4.13 s

The two serving paths differ (CDN, nginx SSR cache, HTTP/2 against a local Node proxy), so these numbers say nothing about the code. The like-for-like table above is the comparison that counts.

Best Practices was 75 on production's `/canales/la-1` against 96 locally. The difference comes from browser console errors, which are the Cloudflare-refused speculation prefetches (see H); it is not a code difference.

None of the pages has LCP within 2.5 s in the lab: the home page is around 5.5 s and the channel page around 7 s. That predates 2B and is for Phase 2C/performance work. TS-14 (home transfer state) is the known lead.

## J. SEO regression

- **Head and header comparison, production vs candidate, 25 URLs** (every template plus the 2A redirects): **0 differences.** Checked: status, Location, title, canonical, meta robots, X-Robots-Tag, JSON-LD `@type` set, X-Frame-Options, CSP, affiliate `rel`.
  - The new match H1 adds no schema and changes neither the title nor the canonical.
  - The only body change that matters for SEO is that the H1 is now present.
- **`npm run seo:ssr-resilience`:** 22/22 OK. That covers:
  - 11 outage routes: 503, no-store, noindex
  - 8 single-hop 301s
  - the widget: 200, noindex, `frame-ancestors *`, no XFO
  - SAMEORIGIN elsewhere
  - `/tendencias` noindex without data
- **`npm run seo:crawl http://127.0.0.1:3191`:** 305/305 sitemap URLs, **0 issues.**
- **Mobile/desktop parity:** a single SSR HTML is served for every viewport, and the fixes are CSS and templates only, so nothing differs between mobile and desktop.
- **Embed framing:** unchanged, and the widget renders inside a foreign-origin iframe.
- **Unchanged by construction:** sitemap generation, article metadata, the affiliate classification and the match slug logic. No backend change.

## K. Remaining limitations and findings outside 2B's scope

1. **Phase 2A item, legacy match canonical after cache expiry. Confirmed issue in production, not fixed: backend.**
   - On production the new Madrid-dated slugs sometimes answer `NOT_FOUND`. Examples: `ca-paranaense-se-palmeiras-2026-10-18`, `sc-corinthians-paulista-ec-vitoria-2026-10-20`. The page then shows "Partido no encontrado" (200, noindex).
   - Minutes later the same or another slug resolves (`clube-do-remo-rb-bragantino-2026-10-19` failed, then worked).
   - Pattern: when football-data.org rate-limits, `FallbackFootballDataProvider.getMatch` falls back to the EPG provider, which doesn't carry those competitions (hypothesis; provider logs not inspected).
   - The legacy slug `ca-paranaense-se-palmeiras-2026-10-17` served `index, follow` with a **self-canonical to the legacy URL**. The API answered for that same slug with `slug: …-10-18` at the same time, so a stale cached detail is the likely cause; which cache holds it was not identified.
   - **Recommendation for 2C:**
     - Cache detail-by-slug as the resolved match id.
     - Don't fall back to EPG for a not-found on a provider-only competition.
     - 301 legacy slugs to `match.slug`.
     - Treat a stale pre-2A detail payload as a miss.
2. **Phase 2A item, affiliate `sponsored`. Not required today.**
   - All 12 production redirect destinations are plain brand URLs with no affiliate parameters: `amazon.es/amazonprime`, `netflix.com/es/signup`, `disneyplus.com/es-es`, …
   - The links already carry `nofollow` and the redirects carry `X-Robots-Tag: noindex, nofollow` (verified). That matches Google's guidance for non-paid outbound redirects.
   - The existing rule (`sponsored` when `affiliate_configured`) covers commission links once they exist.
3. **CORS rejection answers 500 instead of 403** (`/v2/telemetry/*`, `/v2/affiliate/resolve` with a non-allow-listed Origin). Harmless for users, but it pollutes error metrics. Backend.
4. **`/tendencias` CLS is 0.48–0.50 in the lab, before and after** — not caused by 2B. It is the list replacing the loading block; a reserved height would fix it.
5. **Smaller observations:**
   - `/plataformas` answered 503 + noindex twice on production (transient API failure; 4/4 later loads were 200).
   - `/storage/channel_icons/etbon_oca1_tv.webp` returns 404.
   - Static icons are served `private, no-store`, because `publicCachePolicy` runs before `express.static`.
6. The light-theme contrast tokens (G) need a design decision.
7. The new match H1 is generic ("Local - Visitante"). Making the visible breadcrumb deeper is still pending from 2A.

## L. Deployment recommendation

**Ready for review.** Recommended: merge and deploy after owner review.

- Frontend-only release; no backend change, migration or new dependency.
- The SSR nginx cache (`proxy_cache_valid 200 5m`) can serve the old HTML for up to 5 minutes.

After deploy, check production:
1. `E2E_BASE_URL=https://guiaprogramaciontv.com npx playwright test e2e/specs/responsive.spec.ts`: expect 183 passed (match/competition depend on today's data).
2. `npm run seo:crawl`: expect 305/305 and 0 issues.
3. `/canales/la-1` and `/deportes/futbol/partidos-hoy` at 390 px: `scrollWidth === innerWidth`.
4. Widget inside a third-party page: it opens on "Ahora" and shows `HH:mm` times.

Do not call production fixed until those pass on the deployed release.
