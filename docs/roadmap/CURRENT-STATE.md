# GuíaTV — current state (M00, verified 2026-10-22 ~09:15 UTC)

Written for: the owner and whoever executes the next milestone. Plan: [GUIATV-MILESTONES.md](GUIATV-MILESTONES.md). Update this file at the end of every milestone; it records only what was observed, with the source of each fact.

## Verified facts

| Fact | Evidence |
|---|---|
| `main` = `ac58a24` (Phase 3E, PR #50, merged 08:44Z) | `git rev-parse origin/main` after fetch |
| Open PRs: **#51 only** (Phase 3F, head `36b0e15`, not draft, `MERGEABLE`/`CLEAN`, no review). Checks: `verify` ✔, `ssr-resilience` ✔, `live-crawl` skipped by design; workflows *Build, test, and performance budgets* and *SEO regression* ✔ on `36b0e15` | `gh pr view 51`, `gh run list` |
| `main` has **no branch protection** (API 404): "required checks" are convention, not enforced | `gh api …/branches/main/protection` |
| Phase 3D = PR #48, `ed03242`. Phase 3C = PR #47, `6907540`. Squash-merged PRs #49 (stacked 3E, base = 3D branch) and #50 (3E re-landed on `main`) both exist; only #50 is on `main` | `gh pr list --state all` |
| CI on `main` push `ac58a24`: success. **No deploy run exists for `ac58a24`** | `gh run list` |
| Deploy history: `deploy-artifact.yml` ran **once** (dispatch, `6907540`, 2026-10-21 23:01Z, success). `deploy.yml` ran on push for `ed03242` (08:36Z, success) via the old compile-on-VPS path. Both are now `workflow_dispatch`-only | `gh run list --workflow …`, workflow files |
| **Production runs the Phase 3D build.** API uptime was 2,191 s at 09:15Z (restart ≈ 08:38Z, matches the `ed03242` deploy); `/v2/health/metrics` has no `legacyEnrichment` block and `/v2/health` has no `X-Legacy-Enrichment-Epoch`, i.e. the 3E code is not live | public GETs, this session |
| Activation flags: every `CONTENT_*`, public-read, canary, identity-write, `EPG_YEAR_PROVENANCE` and `CONTENT_LEGACY_ENRICHMENT_*` flag is **default-off in code** (`LegacyEnrichmentPolicy`: anything but `ENABLED=true` = off; `SCOPE` unset serves nothing; `KILL`/`KILL_FILE` instant off). Production `api.env` was **not read** (no SSH here); "unset" rests on the 3C/3F reports and the uptime probe's entity-reads-off invariant | source + docs |
| Rollback: `scripts/guiatv-ops.sh rollback [release-id]`; triggers in `docs/release-workflow.md`; legacy enrichment adds a kill file / flag unset. **No rollback drill has been run on the VPS** (3F §2) | `docs/ops/VPS-RELIABILITY-RUNBOOK.md`, 3F report |
| CI (`performance.yml` `verify`): lint, backend tests on MongoDB 8 (`*.mongo.test.ts` included), deploy-script sandbox, ops tests, Karma, production build with Angular budgets. `seo-regression.yml`: SSR/cache tests, Playwright entity specs, `seo:ssr-resilience`, live crawl of production (manual dispatch only) | workflow files |
| Roadmap/tracking docs before M00: none (`git ls-files` for roadmap/milestone) | repo |

## Phase status (engineering / CI / merge / deploy / activation)

| Phase | Eng | CI | Merge | Deploy | Activation |
|---|---|---|---|---|---|
| 3C (#47) | done | ✔ | `6907540` | artifact deploy ✔ | none (flags off) |
| 3D (#48) | done | ✔ | `ed03242` | **live** (old on-host build) | none; owner signature needed again (evidence changed, 3D §9) |
| 3E (#50) | done | ✔ | `ac58a24` | **not deployed** | none |
| 3F (#51) | done, see below | ✔ on `36b0e15` | **open** | not applicable until merged | none |

## Phase 3F reconciliation (PR #51: 23 files, +2,110/−12)

| Item | State |
|---|---|
| Read-only preflight `legacy-enrichment-preflight` (guarded, exit 97 on write) | **Implemented + Mongo-tested in CI.** Never run against production data (needs VPS) |
| `mediaId` propagation fix (`SyncEPGData` db-cache branches, repository projection) | **Implemented + tested.** Only affects programmes synced *after* a deploy; real `catalogueRowShare` unmeasured |
| Real EPG measurements (public GETs) | **Done**: horizon is **3 days, not 7**; 421 indexable films, 42 gain airings beyond the legacy window; `/peliculas/` pages are not in any sitemap |
| Candidate pages | 5 proposed + 25 reserves, **time-sensitive** (legacy page turns `noindex` when its last airing today/tomorrow passes; guide has 3 days) |
| SEO before-snapshots + `legacy-rollout-snapshot` compare tool | Before-snapshots taken 2026-10-22; tool implemented and unit-tested |
| Runtime metrics + latency baselines | `/v2/health/metrics.legacyEnrichment` counters; baselines recorded (slug p95 148 ms, `tv/read` p95 615 ms); rollback thresholds proposed (owner may tighten) |
| Kill switch / rollback | Kill env/file, scope list, breaker, 800 ms budget exist (3E); thresholds in 3F §6 |

## Genuine deficiencies and blockers

1. **`scripts/legacy-rollout-snapshot.test.mjs` is not run by CI** (`test:ops` lists three files; no workflow references it). Add it to `test:ops` in PR #51 (one line). → M02-A.
2. **3E report is stale on two points**: it says "not merged" and describes a 7-day window; the guide has 3 days (3F corrects the copy, not the 3E document). Treat 3F §3 as authoritative.
3. **Deploy ordering**: deploying `ac58a24` before #51 would ship 3E without the `mediaId` fix and metrics block, wasting a sync cycle. Roadmap orders merge of #51 before the deploy (M02-A → M01-B).
4. **Needs the owner/operator, not an agent**: VPS pre-checks and preflight run (no SSH from here), deploy approval and window, activation approval and final paths, merge approval for #51.
5. `main` unprotected; Contabo outage root cause still open (2026-10-20/21) — deploy only in a watched window.
6. Production flag state and the previous release id are unverified until M01-A.

## Safety statement for M00

Documentation only. No flag, deploy, restart, migration, credential or indexation rule was touched; production was read through public GETs only.
