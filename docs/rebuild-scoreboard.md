# GuiaTV Rebuild — Quality Scoreboard

Maintained by `rebuild-orchestrator`. Updated every round. A gate is only PASS with evidence (raw HTML / real request-response / screenshot) — see brief §41/§43.

## Round 1 (baseline) — 2026-08-12

| Gate | Status | Evidence |
|---|---|---|
| Architecture: repo audit complete | PASS | `docs/rebuild-audit-round1.md` |
| Architecture: canonical APIs identified | PASS | same, canonical vs legacy `/v2` map produced |
| Architecture: no accidental duplicated arch | PARTIAL | "two shells" defect from prior audit already fixed; 9 zero-usage legacy components + 4 orphaned pages found, not yet removed |
| SSR: home contains real data | **FAIL** | raw HTML has 0 program/channel titles; `tv-data.facade.ts` isBrowser guards (10 sites) + backend `/v2/tv/read*` returns 0 items |
| SSR: TV guide contains real data | **FAIL** | same root cause, all 4 unified-guide tabs affected |
| SSR: editorial contains real posts | **FAIL** (high-confidence fix identified) | `/v2/blog` itself returns real data; `editorial.service.ts:55-63` gates it on `isBrowser` unnecessarily — proven unneeded gate |
| SSR: detail pages return useful HTML | PASS | películas/series/channel-independent detail pages bypass broken facades, SSR real content |
| Backend: EPG | **FAIL** | `/v2/tv/read`, `/v2/tv/read/channels`, `/v2/tv/surface/guide`, `/v2/tv/surface/channels/:id` all `200` with 0 items, today+yesterday |
| Backend: discovery | PARTIAL | `/v2/discovery/home` populated except `liveItems`/`tonightItems` (EPG-dependent) = 0 |
| Backend: catalog | PASS | `/v2/catalog*` real data |
| Backend: blog | PASS | `/v2/blog*` real data |
| Backend: health | PASS | `/v2/health` 200 |
| Data: no major gap/corruption | **FAIL** | EPG pipeline empty is itself the corruption |
| SEO: sitemap valid | PARTIAL | index + 4/5 sub-sitemaps real; `sitemap-programs.xml` valid but empty urlset (consequence of empty EPG) |
| SEO: robots.txt | PASS | valid, sensible rules |
| UX/UI: semantic accents distinct | **FAIL** | `design-tokens.scss:47-52` — live/discover/streaming/sports/editorial all `#dc2626` |
| QA: frontend test/lint coverage | **FAIL** | no `test`/`lint` npm scripts; 7 spec files; no e2e/Playwright |

## Round 2a result — SSR facade fix (VERIFIED, not yet deployed)

`ssr-facade-fix` agent fixed bugs 1-4 in the working tree (not the live release):
- `tv-data.facade.ts` — removed all 10 `isBrowser` empty-guards; server now resolves via the same server-safe `HttpClient` path already used by the working control group (`CatalogService`/`DiscoveryService`), relying on Angular's built-in HTTP transfer-cache (`provideClientHydration(withEventReplay())`) — no hand-rolled TransferState needed.
- `portal-home.facade.ts:37-56` — redundant gate removed.
- `editorial.service.ts:55-63` — unnecessary gate removed.
- `editorial/:slug` hub-shell bug — root-caused as a *consequence* of the editorial.service.ts bug (PostDetailComponent redirects to hub whenever `getPostPageState` emits null, which it always did while `posts$` was forced to `[]`). Fixed by the same change, no separate code needed.

**Verified on a scratch SSR server (port 4599, not live traffic):**
- `/` — real catalog/platform/editorial titles now in raw HTML.
- `/editorial` — real post cards render.
- `/editorial/estrenos-en-streaming-esta-semana` — full real article, correct `<h1>`, `og:title`, canonical, Article JSON-LD — hub-shell bug confirmed fixed.
- `/programacion-tv/guia-canales` — shell now correctly *attempts* the live fetch (confirmed via direct backend call `/v2/tv/read?view=now` still returning `items:[]`) rather than short-circuiting — this page will fully recover once the backend EPG gap (below) is fixed, not before.

`npm run build:ssr` succeeded, no new errors. Not yet committed to git or deployed — holds for Round 2b (EPG root cause) and RUNBOOK review before any deploy.

## Round 2b result — EPG root cause (CRITICAL, ongoing incident)

Read-only investigation confirmed:
- **Chronic OOM crash-loop**: `guiatv-api`'s in-process `node-cron` EPG sync (`syncEPGDataHandler`) has fatal-OOM-crashed on every ~6h tick for weeks (`--max-old-space-size=512` too low for the `Promise.all`-3-full-feeds approach + duplicate `.map()` copy in `annotateSourceParsedData`). `systemd Restart=always` silently self-healed each time, hiding it from casual log checks.
- **EPG data is >1 month stale**: last successful full ingest 2026-07-09/07-11 (confirmed via read-only Mongo `distinct("date")` on `tv_read_airings`/`epg_source_snapshots`). `/v2/tv/read*` returning `200` with 0 items for 08-11/08-12 is *correct* given DB state — bug is upstream in ingestion, not the read path.
- **Separate 2-day full host outage**: VM down 2026-08-10 ~10:39 → 2026-08-12 13:36, both services only just came back up today, unnoticed/unalerted.
- **Prod is stale**: `current` → `releases/20260407143635` (built from git `d16eb52`, 2026-04-07). Only 4 commits landed on `main` since then (167 files), the largest being today's `c782d12 "Rebuild guide frontend experience"` — substantial frontend work (matches several "already fixed" items repo-archaeologist found in the working tree) that has never been deployed.
- **No alerting** on OOM restarts or host downtime — this is why a month-long incident went unnoticed.
- Next cron tick: 18:00 CEST today (checked server clock 15:58 CEST) — will crash again on current code unless the fix lands and deploys first.

**Recommended fix** (not yet executed): refactor `syncScheduledFunction.ts` to process EPG sources sequentially instead of `Promise.all`, drop unfiltered arrays immediately after date-filtering, remove the redundant full-array copy in `annotateSourceParsedData`; raise `--max-old-space-size` as a belt-and-suspenders (host has ~4.6GB available); ship as a **targeted hotfix deploy** (bundled with the already-verified SSR facade fix) ahead of the full visual rebuild, given the time-sensitivity and that it's independent of the a11y/perf/SEO/E2E gates governing the final rebuild release. Backfill sync trigger and alerting setup are follow-ups after the fix is live.

## Known bugs queued for Round 2
1. `tv-data.facade.ts` — 10 `isBrowser` guards returning empty (lines 111-113, 123-125, 150-152, 212-214, 271-283, 323-325, 333-335, 343-345, 362-364, 381-383, 412-414).
2. `portal-home.facade.ts:37-56` — redundant SSR gate.
3. `editorial.service.ts:55-63` — unnecessary gate on an already SSR-safe call. **High-confidence, low-risk fix — do first.**
4. `editorial/:slug` renders generic hub shell instead of the specific article (separate bug from the above, needs its own fix).
5. Backend EPG pipeline empty in production — root cause unknown, needs investigation (cron/job/ingestion, not yet diagnosed). This blocks full recovery of home/guide/plataformas/deportes/canales even after the frontend fix.
6. `admin-schedules.service.ts` calls removed legacy route `/v2/channels` — broken admin feature.
7. `tv-api.service.ts` dead double-prefixed `/v2/v2/admin/sync` methods — safe to delete.
8. Design tokens: semantic accent colors collapsed to one red.
9. 9 zero-usage legacy components + 4 orphaned unrouted pages — safe cleanup candidates.
10. No frontend test/lint scripts — testing gap to close per brief §35.

## Next round plan
- **Round 2a (angular-ssr-engineer):** Fix items 1-4 (proven-safe SSR facade bugs). Build and verify locally (not against live `current`) via SSR-server curl before any deploy.
- **Round 2b (backend-data-engineer, read-only investigation):** Root-cause item 5 — EPG pipeline emptiness. No production mutation without explicit confirmation.
- Visual/UX direction work intentionally deferred until SSR + EPG data gates are closer to PASS — redesigning on top of broken data is wasted work.
