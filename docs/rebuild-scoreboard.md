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

## Round 3 result — INCIDENT RESOLVED (2026-08-12 ~16:15 CEST)

Full sequence executed and verified:
1. Committed `f7618c8` (SSR facade fix + EPG sync memory fix) to `main`.
2. `sudo ./deploy-guiatv.sh` — new release `20260812161338` live, `guiatv-api`/`guiatv-ssr` restarted, 0 crashes since, all scripted status-code smokes passed.
3. `npm run job:syncEPG` — all 12 source×date syncs succeeded (0 OOM crashes), ~11,900 real programs saved for 20260812-20260814.
4. Cleared `precomputed:*`/`schedule:*` Redis keys per RUNBOOK, ran `npm run job:precompute` — 4/4 dates rebuilt (20260812: 20,543 airings, 8,731 brands).
5. **Extra fix needed beyond RUNBOOK's documented steps**: a separate `tv:read:*` Redis cache namespace (not covered by the RUNBOOK's `precomputed:*`/`schedule:*` clear instructions) was still serving a stale empty result. Cleared it too — **note for RUNBOOK maintainers**: the "Rebuild ventana canónica" section should also clear `tv:read:*`.
6. Verified with real evidence, live production domain, cache-busted:
   - `/v2/tv/read` → 5000 items, 828 channels (was 0/0).
   - `/v2/tv/surface/guide` → 733 nowItems, 695 nextItems, 653 nightItems, 735 channels, 18,068 totalItems (was all 0).
   - `/programacion-tv/guia-canales` SSR → real live programs, e.g. "LA 1 · 15:50 - 18:30 · Directo al grano" with real description (was empty shell).
   - `/canales/la_1` SSR → real "Ahora: Directo al grano 15:50-18:30" + related channels (was explicit "Canal no disponible" error state).
   - Home (`/`) and `/editorial` + `/editorial/:slug` → confirmed real content (nginx `proxy_cache`, 5min TTL, caused a false-negative on the very first post-deploy check — self-expired, non-issue).

**Backend gate: now PASS** (was FAIL). **SSR gate: now PASS** for home/guide/editorial/channel routes (was FAIL). Data staleness (>1 month) resolved for the tested window (today/tomorrow/day-after); the underlying 6-hourly cron will keep it current going forward now that the OOM bug is fixed.

## Alerting — DONE, and it immediately caught a second, separate issue

Built `scripts/health-watchdog.mjs` (checks unit-active, recent OOM/core-dump in journal, EPG-today freshness via real `/v2/tv/read` request; writes to `/var/log/guiatv/health-alerts.log`, optional webhook via `GUIATV_ALERT_WEBHOOK_URL`, heartbeat file for "watchdog itself/host went dark" detection). Wired as `guiatv-health-watchdog.timer` (every 10min, enabled+running) plus `OnFailure=guiatv-crash-alert@%n.service` on both `guiatv-api.service`/`guiatv-ssr.service` for immediate per-crash logging.

**It immediately proved its worth**: shortly after the hotfix deploy, `guiatv-api` started crash-looping again — `NRestarts` went 0→4 within ~20 minutes post-deploy. Investigated properly rather than reflexively re-tuning:
- **Not the original EPG sync bug** — no sync-related log lines precede these crashes; they occur under plain request traffic (`/v2/catalog/slug/*` lookups, ~90% carrying `userAgent: "node"`, many resulting in 404 + an ~8s TMDB fallback lookup per miss, no evidence of negative-result caching).
- **Host is genuinely memory-tight right now**: 7.8GB total, `mongod` ~2.67GB RSS (WiredTiger cache itself is already capped at 0.5GB in `/etc/mongod.conf`, so the rest is mostly mapped file pages), Valkey ~0.6GB, 4 *other* sites on this same shared host (~0.3GB combined), and — a real confound — this active Claude Code/VS Code-server session's own tooling (~1.57GB: ts-server ×2, claude-code, cloudcode_cli, file watcher). `free -h` showed as little as 151MB free / ~700MB available with ~2GB swapped during the observed climbs.
- `guiatv-api` RSS climbed ~2MB/s toward its 1536MB heap cap under this traffic before each restart.
- **Deliberately did not** re-tune the heap cap (up or down) or touch the TMDB/rate-limit code under this time pressure and uncertainty — the confound from this session's own memory footprint makes it hard to know how much of this is a lasting app issue vs. transient host contention *right now*. Rate limiting (`catalogRateLimit`, 300 req/min/IP, correctly wired to `/v2/catalog/slug/*` with `trust proxy` set) is not the gap — observed rate (~20 req/min) is well under it, so this looks like either distributed/low-and-slow bot traffic or genuine user traffic hitting an expensive uncached path, not a rate-limit hole.

**Net effect**: crashes continue every several minutes right now, but are self-healing (~2s downtime each, systemd `Restart=always`) and — critically — no longer silent. This is a real, separate, lower-severity-than-the-original-incident issue, tracked here rather than guessed at live. **Recommended next investigation** (not yet started): negative-result caching for `/v2/catalog/slug/*` TMDB fallback lookups, and re-measure host memory pressure once this session ends (to separate the session-contention confound from a real app-level leak) before any further heap tuning.

## Round 4 result — catalog-slug crash-loop FIXED, deployed, live-verified

Root cause confirmed: `CatalogService.getBySlug()` had no negative-result cache — every request for a nonexistent slug re-hit TMDB live (up to 8s), with no dedup across concurrent identical requests. Fix (`3006796`, +61 lines, purely additive): Valkey-backed negative cache (6h TTL) + in-flight request dedup. 35/35 backend tests pass (3 new, proving the exact cache/dedup behavior). Deployed as release `20260812174234`.

**Live-verified**: `curl` a genuinely nonexistent slug twice — first request 18.5s (real TMDB miss), second identical request 0.85s (cache hit, ~22x faster). New process: 0 restarts in first 3 minutes post-deploy (vs. crashing every ~7-10 min before the fix). Continued stability is now tracked automatically by `guiatv-health-watchdog` rather than requiring manual observation.

Both production incidents from this session are now: root-caused, fixed with evidence (tests + live verification), deployed, and covered by alerting going forward.

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
