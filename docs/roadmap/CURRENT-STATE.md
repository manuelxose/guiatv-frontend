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

## Addendum — M02-A (2026-10-22)

- PR #52 squash-merged: `main` = `44b8391`. PR #51 rebased onto it; `scripts/legacy-rollout-snapshot.test.mjs` is now in `test:ops` (deficiency 1 resolved). Backend suite with MongoDB: 610 pass / 0 fail (incl. `mediaId` cache and preflight Mongo tests); `tsc` clean; `test:ops` 18 pass.
- Review of #51: `mediaId` is copied only from the same stored programme row that supplies `tmdbId` (first alias match, absent → omitted, never synthesised); preflight runs under the read-only guard (exit 97 on write); snapshot tool only issues GETs and writes `--out`; no flag defaults changed; no workflow runs on merge. No critical/high findings.
- Corrections: the 3E report's "not merged" is superseded (merged `ac58a24`, **not deployed**); EPG horizon is **3 days**, not 7. Historical reports are left unchanged.
- Remaining: owner merge approval for #51; VPS-only checks (M01-A), preflight against real data (M02-B); all activation stays owner-gated.

## M01-A addendum — production readiness (2026-10-22 ~10:05Z, read-only)

Method: SSH `contabo` (read-only commands only), public GETs. Nothing restarted, written, deployed or compiled.

**Phase 3F**: PR #51 head `0f85308` unchanged since review, `verify` ✔ `ssr-resilience` ✔ (`live-crawl` skipped by design), no review findings, no `.github/` change, both deploy workflows `workflow_dispatch`-only. Squash-merged → `main` = `221ca46`. The push ran only *Build, test, and performance budgets*; no deploy run. Flags unchanged (code default-off).

**Release baseline**: live = `releases/20261022103818`, `gitSha ed03242` (Phase 3D, old compile-on-VPS deploy, 08:38Z); checkout HEAD `ed03242`, clean (only untracked `.editorial-publish/`). `main` is 3 commits ahead (3E, M00, 3F), **not deployed**. `package-lock.json` unchanged `ed03242`→`main` and equals the server stamp, so the artifact path will not be refused for stale dependencies.

**Rollback**: releases on disk `20261021190805, …195307, …205747, 20261022010257 (6907540, Phase 3C), 20261022103818 (live)`. `guiatv-ops.sh rollback` (no id) picks `20261022010257`: atomic `ln -sfn` + `mv -Tf`, restarts API then SSR each health-verified, warms hubs, re-verifies; runs as root under the shared flock. `deploy-guiatv.sh` also auto-rolls back to the previous release if anything fails after publish starts. Data: 3E/3F add no migration/schema change (diff checked); `db:bootstrap` runs only with `BOOTSTRAP_DB=1`, which `deploy-artifact.yml` does not set; every flag off, so the old release reads the same data. **Never drilled on the VPS** (needs separate owner authorization).

**Deployment safety (code read, not executed)**: concurrency group `deploy-prod`, `cancel-in-progress: false`, build job 30 min, deploy job 20 min, ssh `command_timeout` 15 m, `script_stop`; server `flock /var/lock/guiatv-deploy.lock` (free; exit 75 if held); sha256 verified, `ARTIFACT_GIT_SHA` must equal checkout HEAD, lockfile-stamp guard, no `npm`/build on the host; post-publish smoke: 8 API, 8 SSR (incl. 301s) and Socket.IO checks; auth smokes skipped without `SMOKE_AUTH_TOKEN`. Caveat: the script `git reset --hard`s the live checkout it is running from (existing behaviour, worked on the 3C artifact deploy).

**Runtime (10:05Z)**: `guiatv-api`, `guiatv-ssr`, `nginx`, `mongod`, `valkey` active; 0 `NRestarts`; only failed unit `systemd-networkd-wait-online` (cosmetic, repeated). RAM 11.9 GB, 7.7 GB available, swap 4 GB file 0 B used, swappiness 10; `/` 145 GB, 42 % used, inodes 5 %. Kernel OOM/panic/hung-task/I-O-error lines: 0 in the last three boots. API `/v2/health` healthy. Services have no `MemoryMax`.

**Flags (effective)**: no `CONTENT_*`, `EPG_YEAR_PROVENANCE`, entity, canary, identity-write or legacy-enrichment variable exists in `api.env`, `ssr.env` or the running API/SSR process environments (checked by name only; no values read) → **all unset = off**. `post-boot.json` agrees (`activationFlagsPresent: []`, `entityReads: off`).

**Public baseline** (single GET each, curl, from WSL; all `index, follow` + matching canonical unless noted):

| URL | Status | Time | Bytes |
|---|---|---|---|
| `/` | 200 | 0.23–0.32 s | 1,124,713 |
| `/canales/la-1` | 200 | 0.81 s | 360,307 |
| `/canales/la-2` | 200 | 1.15 s | 503,863 |
| `/programas/chicago-pd` | 200 | 0.79 s | 232,575 |
| `/peliculas/gladiator` (legacy movie detail) | 200 | 0.64 s | 221,682 |
| `/peliculas/bikeriders-la-ley-del-asfalto` | 200 | 0.60 s | 218,895 |
| `/programacion-tv/en-directo` | 200 | 0.85 s | 450,402 |
| `/programacion-tv/peliculas` | 200 | 4.74 s (cold) | 372,228 |
| `/robots.txt`, `/sitemap.xml` (4 child sitemaps) | 200 | 0.26 s | 470 / 619 |
| `/v2/health` | 200 | 0.22 s | 526 |
| `/peliculas` (not a route) | 404 `noindex, nofollow` | 0.42 s | – |

`/api/v2/health` is 404 (health lives at `/v2/health`). `/peliculas/a|b` pages are not in any sitemap (3F finding).

**Outages (journal evidence)**:
- Verified: boot of 2026-10-20 17:24 ended with a **clean systemd poweroff** (23 min down, `last -x`): someone/something requested shutdown; not a crash. Boot of 21 Oct ends 20:58:47 CEST mid-service (valkey save line), no shutdown sequence, no kernel OOM/panic/hung/IO lines; node memory peak 2.7 GB of 11.9 GB, swap unused; VM is KVM. Reboot at 21:18 (owner).
- Verified: the ten "guiatv-api crashed" alerts on 21 Oct (and 10:38 on 22 Oct) are **restarts**: each shows `Stopping…` then exit status 1 ≈10 s later (stop timeout) and `OnFailure` firing. They are false-positive "crash" alerts and noise, not 10 crashes. The last one (20:57:51–20:58:01) precedes the journal cut by ~45 s: a restart was in progress shortly before the host vanished (correlation, not cause).
- `post-boot.json` says `endedWithoutShutdown: false` for the 21 Oct boot although the journal shows no shutdown: the detector under-reports; do not rely on it.
- Hypotheses (unproven): provider-side hard stop/migration (best fit for a silent cut, needs Contabo ticket); a memory/IO stall during on-host builds (no supporting counters). **No root cause.** Mitigations needing owner approval: file the Contabo ticket with the timestamps; artifact deploys only; `MemoryMax`/`OOMScoreAdjust` on units; fix the API's slow stop (10 s → exit 1) and the crash-alert wording; persistent journald is already on.

**Outstanding risks**: no rollback drill; `main` unprotected; outage cause open; 10 s API stop timeout makes every restart look like a failure; `deploy-guiatv.sh` self-replacement during run; auth smokes skipped without `SMOKE_AUTH_TOKEN`; `/programacion-tv/peliculas` cold render 4.7 s.

**M01-B prerequisites**: owner go + window, watched deploy (`gh workflow run deploy-artifact.yml --ref main`, then confirm the run built `221ca46`); pre-record `readlink current` (rollback id `20261022010257`); post-deploy compare this baseline (status, canonical, robots, payload size ±), `/v2/health/metrics` shows the `legacyEnrichment` block with flag off, flags still unset; abort and `guiatv-ops.sh rollback` on any smoke failure.

**Decision: CONDITIONAL GO for M01-B** (owner approval required; rollback drill recommended first or accept its absence explicitly).
