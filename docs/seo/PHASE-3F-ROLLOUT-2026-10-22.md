# Phase 3F: legacy enrichment — closure, real-data validation, rollout preparation (2026-10-22)

Written for: the owner (who must approve the deploy and the activation) and the operator who will run the commands. Builds on [Phase 3E](PHASE-3E-IMPLEMENTATION-2026-10-22.md).

| Item | State |
|---|---|
| Phase 3E integration | **Done.** PR #50 squash-merged to `main` as `ac58a24` after `verify` and `ssr-resilience` passed |
| Production deploy of 3E | **Not done, needs your approval** (§2). Merging deployed nothing: `deploy.yml` is manual-only (verified: no run exists for `ac58a24` except CI) |
| Production now | Phase 3D build (`ed03242`), compiled on the VPS by the old workflow when #48 merged; API restarted 08:38 UTC, health 200, 0 server errors. Not inspected over SSH |
| Enrichment flag | **Off**, nothing activated |
| Real-data validation | **Partly done, one decisive measurement blocked** (§3) |
| Rollout sample | 5 pages proposed, 25 reserves, before-snapshots taken (§5) |

## 1. Phase 3E closure

PR #50 = the five 3E commits on top of current `main` (no duplicates; its tree equals the green #49 branch). Required checks passed (`verify` 4m46s, `ssr-resilience` 2m45s). Only `deploy.yml` and `deploy-artifact.yml` can reach the VPS (6 and 3 `DEPLOY_SSH` references) and both are `workflow_dispatch` only. A static test pins that.

## 2. Deployment: where it stops

I did not deploy and did not infer authorisation from the existence of this task. The invocation, once you approve a window:

```bash
gh workflow run deploy-artifact.yml --ref main      # CI builds ac58a24+ off-host; the VPS only verifies, unpacks, publishes, smoke-tests
```

Before it (operator, read-only, on the VPS — **I have not run any of this**): `git -C /var/www/guiatv rev-parse HEAD` and `readlink /var/www/guiatv/current` (live commit and release id; note the previous release for rollback), `scripts/guiatv-ops.sh status`, `df -h /var/www /var/cache/nginx`, `free -m` (the script refuses below `BUILD_MIN_AVAILABLE_MB`; an artifact deploy does not compile), `systemctl is-active guiatv-api guiatv-ssr nginx mongod valkey`, `/etc/guiatv/api.env` has no `CONTENT_ENTITIES_*`, identity-write, public-read, canary or `EPG_YEAR_PROVENANCE` and **no** `CONTENT_LEGACY_ENRICHMENT_*`. Lock and concurrency: both deploy workflows share `concurrency: deploy-prod` (no cancel) and the script takes `/var/lock/guiatv-deploy.lock` (exit 75 if busy). Rollback: `sudo /var/www/guiatv/scripts/guiatv-ops.sh rollback [release-id]` (previous healthy release = the one noted above; **no drill was run**). After: existing routes, `/sitemap.xml`, canonical and robots of a sample, `/v2/health/metrics` (new `legacyEnrichment` block, epoch `off`).

The deploy itself must not enable enrichment, and with the flag unset the new code returns the legacy payload unchanged.

## 3. Real production measurements (public GETs only, ~09:00 Madrid)

Files: `phase-3f/real-epg-measurements-20261022.json`, `prod-metrics-baseline-20261022.json`. No database or SSH access was used or attempted.

| Measurement | Result |
|---|---|
| **EPG horizon** | **3 days, not 7.** Airings today 12,791 / +1 day 9,744 / +2 days 6,831 (partial) / +3 days and later **0**. The "7-day window" can never fill. The empty-state copy said "próximos 7 días"; corrected to "en la programación disponible" (this PR) |
| Films (category Cine) | 1,576 airings over the 3 days; 922 (58.5 %) carry a TMDB id; 585 distinct films |
| Series | 2,832 airings; 1,564 (55.2 %) with a TMDB id; 200 distinct series |
| Films whose legacy page is indexable now (airing today/tomorrow) | 421 |
| …of those, films with a further airing **beyond** the legacy window (day 3) | **42** (the only place the enriched schedule adds airings for an already-indexable page) |
| Films scheduled only on day 3 (legacy page is noindex, shows no schedule) | 164 (enrichment would show their schedule; robots stay noindex by design) |
| Wrong EPG TMDB matches visible in the guide | e.g. TMDB 168259 carries both "Fast & Furious 6" and "…7"; TMDB 50619 both Crepúsculo parts (9 films with >1 title key). The legacy page lists both airings (existing behaviour, kept); the evidence join accepts only the airing whose title key matches the page |
| Legacy payloads of the 20 canary pages | 0/20 genres, 0/20 runtime (unchanged since 3E) |
| Legacy pages in the sitemap | `sitemap-programs.xml` holds 822 `/programas/` URLs and **no** `/peliculas/` page: indexable movie pages are found by links only. Out of scope; recorded |

**Blocked, decisive: the share of airings tied to their catalogue row.** The public `tv/read` DTO does not expose `program.mediaId`, so `catalogueRowShare` is unmeasured. It matters: the join keeps an airing only if its `mediaId` equals the validated catalogue row. Code reading found why that share may be low: when the EPG sync enriched a programme from **its own stored-programme cache** (no TMDB call), it copied `tmdbId` but **not** `mediaId` (`SyncEPGData` db-cache branches), so those airings could never be verified. Fixed at the root in this PR (the stored programme's own `mediaId` travels with its `tmdbId`; none is invented), with a test. It takes effect for programmes synced after the deploy. To measure the real share, run the read-only preflight (§4) on the VPS; until then "verified broadcasts per film" is **not known** for production and is not estimated here.

Latency baseline (server side, `GET /v2/health/metrics`, process up ~16 min, rolling samples, includes my probing): `GET /v2/catalog/slug/:contentType/:slug` n=174, p50 14.4 ms, p95 148 ms, p99 241 ms, 0 errors; `GET /v2/tv/read` n=55, p50 40 ms, p95 615 ms, p99 1,116 ms; Mongo overall p95 847 ms, p99 7.2 s (pre-existing tail, EPG-related). From outside (Cloudflare, 50 requests over 5 pages): slug API p50 67 ms, p95 91 ms; rendered page p50 93 ms, p95 113 ms.

## 4. New tools (all read-only or test-only)

- `apps/backend/dist/scripts/legacy-enrichment-preflight.js` — on the VPS, under the read-only guard (a write aborts the process, exit 97): coverage per EPG date (airings, with TMDB id, **with catalogue row**), catalogue rows by completeness (fully fetched, runtime, genres, original title) for the window's TMDB ids, and per candidate: identity refusals, verified broadcasts, beyond-legacy-window count, every rejection reason, what a title-only match would have added (counted, never used) and the latency of both reads. Tested on a scratch database (counts, strictness, zero writes).
  ```bash
  cd /var/www/guiatv/current/apps/backend && set -a && . /etc/guiatv/api.env && set +a
  node dist/scripts/legacy-enrichment-preflight.js --candidates ../../docs/seo/phase-3f/candidates.json --out /tmp/preflight.json
  ```
- `scripts/legacy-rollout-snapshot.mjs snapshot|compare` — public GETs of page + API payload (+ sitemap membership); `compare` fails on any regression of status, robots header and meta, canonical, title, description, Movie JSON-LD (a superset passes; lost or duplicated entity fails), internal links, synopsis, a legacy airing, sitemap membership, markup breakout. Unit-tested on synthetic pages.
- `/v2/health/metrics` now has `legacyEnrichment: { epoch, counters }` (`attached`, `refused:*`, `rejected:*`, `skipped:*`, `timeout`, `error`) so no new monitoring is needed.

## 5. Proposed first sample (5 pages) and evidence

Selection rule, all checked on public data today: legacy page `index, follow`; page TMDB id equals the guide's; page title and guide title have the same identity key; synopsis present; no genres, no runtime; **at least one guide airing beyond the legacy window**; not in any flag-dependent state. 30 films qualify (`phase-3f/candidates.json`).

| Path | TMDB | Legacy airings | Guide airings (3 days) | Beyond legacy window |
|---|---|---|---|---|
| `/peliculas/bikeriders-la-ley-del-asfalto` | 1008409 | 1 | 5 | 4 |
| `/peliculas/california-suite` | 26686 | 1 | 4 | 3 |
| `/peliculas/gladiator` | 98 | 1 | 3 | 2 |
| `/peliculas/una-quinta-portuguesa` | 1440171 | 2 | 4 | 2 |
| `/peliculas/los-subdesarrollados` | 221650 | 1 | 3 | 2 |

Before-snapshots (HTML + API + sitemap membership) are in `phase-3f/rollout-before-20261022.json`: 5/5 HTTP 200, `index, follow`, one canonical, one `Movie` + one `BreadcrumbList`, 31 internal links each, **0/5 in the sitemap**. Pages turn `noindex` by themselves when their last airing today/tomorrow passes; that is the existing rule and the check will say so rather than hide it.

**Not yet knowable:** whether these five have a fully fetched catalogue row and catalogue-row-tied airings. That is what the preflight decides; final allowlist = the candidates it accepts with `verifiedBroadcasts > 0` (swap in reserves from `candidates.json` otherwise). No title-only match is used to fill the gap.

## 6. Activation procedure (needs your separate, explicit approval; `scope=all` is not used)

1. Deploy (§2). Run the preflight; choose 3–5 paths; re-take the before-snapshot if more than a few hours passed.
2. `api.env`: `CONTENT_LEGACY_ENRICHMENT_ENABLED=true`, `CONTENT_LEGACY_ENRICHMENT_SCOPE=/peliculas/a,/peliculas/b,…`; restart **only** `guiatv-api`. `ssr.env` needs nothing (the SSR cache follows the epoch).
3. `curl -sI …/v2/health | grep -i epoch` → `list:…`; wait ≤ 35 s; purge only the SSR cache of those paths in nginx (delete the cache files for those keys, or `find /var/cache/nginx/guiatv -type f -delete` + `nginx -s reload` if per-key lookup is not practical; the 5-minute nginx cache is the only layer the app cannot clear).
4. `node scripts/legacy-rollout-snapshot.mjs snapshot … --out after.json`, then `compare before.json after.json --expect-enriched`. Exit 1 = regression: set the kill file (or unset the flag and restart `guiatv-api`) first, investigate second.
5. Watch `/v2/health/metrics`: `legacyEnrichment.counters`, slug-route p95/p99, `tv/read`, 5xx.

**Rollback triggers, derived from the baseline above** (they are proposals; the owner can tighten them): `compare` fails on any page; slug-route p95 > 300 ms (2 × baseline p95) or p99 > 800 ms for 15 minutes; `GET /v2/tv/read` p95 > 1,230 ms (2 × baseline); any 5xx on the slug route (baseline 0); `timeout` > 1 % of `attached + timeout`, or `skipped:breaker_open` ever > 0; Mongo p99 materially above the 7.2 s baseline tail. Rollback is the kill file or unsetting the flag; nothing was written, so there is nothing to undo.

## 7. Value assessment (for AdSense and users)

For the five proposed pages the additions are: **new factual metadata** (genres, runtime, original title — a measured gap, 0/20 and 0/5 today), **new verified broadcast information** (2–4 airings per page beyond what the page lists today, if the preflight confirms the catalogue binding), **navigation** (channel links per airing). **Not** new editorial value: synopsis, cast and artwork are the same TMDB data as before. None of this is evidence that a low-value-content rejection is resolved; the pages remain mostly third-party metadata plus a schedule. What the observed data supports recommending: original editorial text for the pages that earn traffic (a short "why watch / what to know" per title written by a person), and getting `/peliculas/` pages into a sitemap only after that. The schedule value is also bounded by the 3-day guide: 42 of 421 indexable films gain airings on day 3, and the 164 day-3-only films stay `noindex`.

## 8. Changes in this PR

`SyncEPGData` + repository (stored-programme `mediaId` reuse), `legacy-enrichment-preflight`, `legacy-rollout-snapshot`, `legacyEnrichment` in `/v2/health/metrics`, empty-state copy ("en la programación disponible"), runbook line, evidence files. Entity, identity and publication code untouched; every flag unset.

## 9. Still requires you

1. Approval and window for `gh workflow run deploy-artifact.yml --ref main` (and someone with VPS access for the pre-checks in §2).
2. Read-only preflight output from the VPS (§4); I cannot produce it from here.
3. Separate approval to set `CONTENT_LEGACY_ENRICHMENT_ENABLED` and the final 3–5 paths.

## 10. Recommended next phase

Run §2–§6 for the first pages and watch for a week; if `catalogueRowShare` is low after the sync fix, the next evidence-supported step is tying airings to rows at read-model build time (not relaxing the join). Then editorial text for the pages that gain traffic.
