# Phase 3B — production evidence, canonical validation and controlled readiness (2026-10-21)

Four completion categories, kept apart:

| Category | Status |
|---|---|
| 1. Engineering | **Complete** (this PR): canary mechanism, canonical audit, reviewer ledger, quality criteria, gate fix. Scratch-MongoDB and unit tests pass |
| 2. Data validation | **Partly complete**: fresh read-only replay of four production days done and deterministic; precision is **still not human-measured** |
| 3. Human approval | **Done by AI under the owner's authorisation (§11)**: 360 labels, 99.7 % precision, 119 second-reviewer rows, gate **pass with basis `ai`**. It is `ai_reviewed`, never human-validated precision. (Originally 0 labels; see §4 for the tooling.) |
| 4. Production activation | **Blocked, and not attempted.** Every `CONTENT_*` / public-read / `EPG_YEAR_PROVENANCE` flag is unset in production |

## 1. Fresh production replay (read-only)

The owner authorised read-only production queries, the existing replay, temporary files, the TMDB cache and the runner's `node_modules` symlink. **Only the packaged runner was used**, in an isolated `/tmp/guiatv-3b*` directory on the VPS (no write to `/var/www`, `/etc` or any public path); `docs/seo/phase-2d2f/run-evidence.sh` was **not modified** and no earlier baseline was overwritten (artefacts go to the new `docs/seo/phase-3b/`).

A direct ad-hoc production read (an aggregate over `ssh`) was refused by the environment's classifier and was not retried or worked around; the runner and the bounded read-only `mongosh` scripts below ran without a refusal.

| Safeguard | Result (every run) |
|---|---|
| Read-only guard preloaded in each node process (write/DDL = exit 97) | 186–199 read commands, **no write attempted** |
| Mongo pool 2, 1.2 GB `MemoryMax`, `nice 10`, 600 s | 150–204 MB RSS, 5.8–10.6 s per day |
| `baseline.js` before/after (collections, indexes, `content_*`, airing refs) | **identical**: 40 collections / 272 indexes, no `content_*`, 16 airing indexes, 0 entity/path refs |
| Health before/after | 200 / 200 |
| Determinism (two traces runs of the target day) | byte-identical for all four days |
| TMDB lookups | 246–355 searches per day, 0 failures |

Days replayed (airings now stored): `20261020` 8,348 · `20261021` 11,865 · `20261022` 9,881 · `20261023` 6,859 (still partial). 20261022 is the latest full-volume day; 20261023 is a partial future day.

Two further bounded read-only `mongosh` aggregates over `media_catalog` (counts only, no text): metadata completeness of the accepted works (§6).

## 2. Data quality, and comparison with Phase 2D

Evidence gate (`content-identity evidence`, 2D-2G rules plus one fix, §2.2), per day:

| | 20261020 | 20261021 | 20261022 | 20261023 |
|---|---|---|---|---|
| Airings | 8,348 | 11,865 | 9,881 | 6,859 |
| Candidates / distinct work keys | 2,815 / 2,663 | 3,330 / 3,075 | 2,776 / 2,629 | 1,952 / 1,887 |
| **Proposed entities** | 1,476 | 1,741 | 1,538 | 1,333 |
| **Independently supported** (the only machine `AUTO_ACCEPT`) | 135 (9.1 %) | 193 (11.1 %) | 181 (11.8 %) | 173 (13.0 %) |
| Machine-supported only | 455 | 451 | 419 | 401 |
| Insufficient | 475 | 632 | 537 | 425 |
| **Contradictory** | 411 | 465 | 401 | 334 |
| Candidates never proposed (unknown kind / uncertain title / cross-kind hold) | 1,307 (1,180 / 102 / 25) | 1,547 (1,389 / 113 / 45) | 1,192 (1,049 / 114 / 29) | 592 (520 / 57 / 15) |
| Pathless (missing canonical path) | 211 | 237 | 208 | 184 |
| Legacy ownership conflicts (`historic_conflict`) | 4 | 3 | 4 | 3 |
| TMDB homonyms (unverified) | 59 | 88 | 68 | 69 |
| TMDB unconfirmed (contradiction) | 34 | 40 | 33 | 33 |
| **Gate violations** | 0 | 0 | 0 | 0 |
| Canonical collisions | 0 | 0 | 0 | 0 |
| Verdict digest (prefix) | `58d81fbc` | `7b454631` | `cbb264f7` | `db0c8038` |

Across the four days the accepted works are **519 distinct TMDB works** (405 films, 114 series). Independent evidence per accepted work is only what the gate allows: a unique TMDB title (alternative titles included) **and** at least one consistency check against broadcaster data (runtime vs slot, season count, TMDB genres for kind). Repeated copies of one source (same title on other days, a legacy URL, the catalogue match) are never counted as independent.

### 2.1 Comparison with the Phase 2D baseline (20261020)

| | 2D-2G (11,211 airings) | Fresh (8,348 airings) | Classification |
|---|---|---|---|
| Airings | 11,211 | 8,348 | **Input drift, −25.5 %** between the measurements. Cause not diagnosed; not Phase 3 (flags unset, writes zero) — see §9 |
| Proposed entities | 1,662 | 1,476 | inconclusive (follows the input) |
| Independently supported | 163 (9.8 %) | 135 (9.1 %) | **inconclusive**: −0.7 pt inside the drift |
| Contradictory | 440 (26.5 %) | 411 (27.8 %) | inconclusive |
| Insufficient / machine-supported | 638 (38.4 %) / 421 (25.3 %) | 475 (32.2 %) / 455 (30.8 %) | inconclusive (items move between the two) |
| Unknown-kind candidates | 1,335 (41.9 % of candidates) | 1,180 (41.9 %) | unchanged: still the largest coverage loss |
| Pathless | 224 (13.5 %) | 211 (14.3 %) | inconclusive |
| Gate violations / canonical collisions | 0 / 0 | 0 / 0 | unchanged (good) |

**Like-for-like check.** Re-running the *current* gate on the *stored 2D-2G traces* (same input as the baseline) gives 1,662 proposed, 163 independently supported, assurance counts identical, 0 violations. Only 3 verdict lines differ (a `pathless_unsupported_slug` note on two quarantined items), which changes the digest (`befb3ae7` vs `d35e7caf`) but no decision. So the code changes since 2D-2G did not change results on the baseline input; the differences above are the input's.

**Improvements:** one gate defect found and fixed (§2.2). **Regressions:** none detected. **Inconclusive:** every rate comparison, until the input is comparable. Later days accept a larger share (11–13 %) because tomorrow's EPG carries relatively more films and fewer episodes; that is a property of the day, not of the gate.

### 2.2 Defect found and fixed: accepted without a canonical path

On 20261021 the gate returned `AUTO_ACCEPT` for `9-1-1` (series, TMDB tv:75219) with **no canonical path** (`unsupported_slug`). The contract (§3) requires "a safe canonical path"; the 2D-2G gate checked ownership doubts only. A write run would have created an entity that can never resolve. Fix (`ContentIdentityEvidence.ts`): any `create` candidate without a path is `missing: pathless_<reason>` (quarantine), and `acceptedPathless` is now a gate violation. A pre-existing evidence-test fixture had encoded the defect (a pathless "accepted" 9-1-1) and was corrected; a new test covers it. After the fix 20261021 accepts 193 (was 194 verdict lines / 1 pathless).

### 2.3 Year provenance

Independent year confirmation covers **0** accepted works. `SyncEPGData` stores TMDB's year in `program.year`; the feed's own year is only preserved by `EPG_YEAR_PROVENANCE`, which is **off**, so the raw-year check cannot fire. Only 13.8 % (396/2,866) of 20261020's candidate traces carry any year at all, and none of that is independent. The quality criteria therefore treat the stored year as `unknown`, never `pass`, until raw years exist (a flag the owner must authorise).

## 3. Canonical ownership audit

`content-identity canonical-audit <day.jsonl> [--verdicts …] [--registry] [--out report.json]` (offline; `--registry` also reads stored entities and slugs under the read-only guard). Reports: `docs/seo/phase-3b/canonical-audit-<day>.json` (machine-readable: summary, collisions, quarantine, findings with codes).

Checks over proposed paths: one owner per path (case/slash folded), syntax and normalisation (`normalizeContentPath`), reserved slugs, the kind's namespace, accepted-but-pathless, same slug under two namespaces (review item). Checks over the stored registry: duplicate entities/paths, owners missing, one canonical row per live entity, `canonicalPath` cache equals the row, active entities have a row, redirects end at an active canonical in one hop, no cycles or chains, merged entities keep no canonical row, merge targets exist and are active.

| | 20261020 | 20261021 | 20261022 | 20261023 |
|---|---|---|---|---|
| Proposed with a path / pathless | 1,265 / 211 | 1,504 / 237 | 1,330 / 208 | 1,149 / 184 |
| Legacy-inherited paths (same legacy title answers) | 1,129 | 1,341 | 1,195 | 1,010 |
| **Collisions / blockers** | **0 / 0** | **0 / 0** | **0 / 0** | **0 / 0** |
| Quarantined, by reason | unverified 199 · ambiguous 6 · conflict 4 · unsupported 2 | 228 · 4 · 3 · 2 | 196 · 7 · 4 · 1 | 175 · 5 · 3 · 1 |

**Registry:** production holds no `content_*` collection (baseline `content: []`), so the stored registry is empty and trivially clean; the registry audit is proven on scratch MongoDB (lifecycle fixtures pass; planted corruption — cache mismatch, orphan slug — is found; the read issues no write).

Semantic ambiguity is **reported, never resolved**: 14–24 pathless items per day are `historic_*` (a legacy page answers the slug and ownership cannot be proven); they stay pathless and unresolvable until a person decides.

Two audit rules were removed after the evidence showed them wrong, so they would not mislead: a "legacy conflict" check (the trace lists reasons for *refused* candidate paths; the allocated year path is allowed) and "removed entity keeps canonical row" (removal deliberately keeps the row so the path stays reserved and answers 410; a merge demotes it to a redirect, which *is* checked).

## 4. Human review workflow

Built over the existing administration surface (the server shell CLI and the 2D-2E sheet format), with the unchanged scorer as the gate. File header of `content-identity-review.ts` is the runbook.

| Requirement | Mechanism |
|---|---|
| Sheet from the right population | `evidence-sheet --day <traces>:<verdicts> … --out sheet.csv`: one row per **gate-accepted** identity across days, deterministic sample (seed), independent evidence shown beside each row (never a label) |
| Named, authenticated reviewers | `roster add <name>` (owner only) stores the SHA-256 of a personal token (shown once); `REVIEW_TOKEN` is required for `next`/`decide`; automation names (`claude`, `system`, `codex`…) are refused by `normalizeReviewerName`; roster file mode 600 |
| Accept / reject / uncertain | `review decide … --decision accept|reject|uncertain`; a rejection needs an `--error-category`; sub-labels `--kind-ok --tmdb-ok --path-ok --critical` |
| Immutable history | append-only JSONL ledger, hash-chained; a correction is a new entry that `supersedes` the old one (both stay); `review verify` detects any edit, deletion or reorder (tested) |
| Second reviewer | the second must be a different person; blind (`next` never shows a label); the primary cannot change a label once a second review exists |
| Disagreements | a third person adjudicates; both exported sheets then carry the adjudicated label and note the scorer expects; raw (pre-adjudication) agreement is reported separately |
| Sampling, precision, audit export | `review report` (progress against each threshold, Clopper–Pearson precision and lower bound, reviewers, open disagreements); `review export --out dir` writes `primary.csv`, `second.csv`, `report.json` and a ledger copy |
| Thresholds | unchanged and enforced by `scoreReview`: ≥ 300 labelled, ≥ 98 % precision, ≥ 50 second-reviewer rows, error categories, no open disagreement. `export` exits 2 until it passes |

Review sheet ready for the owner: `docs/seo/phase-3b/review-sheet-3b.csv` — 360 rows drawn from 519 accepted identities (seed `phase-3b-20261021`, 60 spare for `uncertain`). **No label was created or pre-filled; no assistant output is a label.** Progress today: **0 / 300 labels, 0 / 50 second reviews.**

An end-to-end smoke ran in a throwaway scratch directory with obviously fake reviewer names (open, next, decide, wrong-token refusal, double-decision refusal, report, tamper detection → exit 2); nothing from it is kept.

## 5. Bounded canary (all default off)

`EntityPublicReadPolicy` decides per request; `GET /v2/entities/resolve` and the sitemap both use it.

| Flag | Meaning |
|---|---|
| `CONTENT_ENTITY_PUBLIC_READ_ENABLED=true` | master switch (3A) — **alone it now serves nothing** |
| `CONTENT_ENTITY_PUBLIC_READ_SCOPE=canary\|all` | must be written out; unset or any other value = off. `all` is the 3A behaviour |
| `CONTENT_ENTITY_CANARY_FILE`, `CONTENT_ENTITY_CANARY_MAX` | allowlist `{version:1, entities:[{entityId, canonicalPath, approvedBy, approvedAt}]}` and a ceiling 1…25; a longer list, a missing ceiling or any malformed entry disables the whole canary |
| `CONTENT_ENTITY_PUBLIC_READ_KILL=true` or `CONTENT_ENTITY_KILL_FILE` existing | instant fallback to legacy, **no restart**, overrides `all` too |

Behaviour:

- **Cannot expose the corpus.** The 3A flag alone, or with an unknown scope, returns the legacy signal. 3A's own tests were updated to set `scope=all`.
- **Existing pages are never removed.** Every refusal in canary scope (not allowlisted, killed, breaker open, invalid config, failed revalidation, error) answers `ENTITY_PUBLIC_READ_DISABLED`, so the frontend keeps rendering the legacy page. This also fixes a latent 3A hazard: with `ENABLED=true` and a corpus of a few entities, 3A would have 404'd every legacy `/peliculas|series|programas/<slug>` page.
- **Read-time revalidation.** An allowlisted path is served only if the registry still says: canonical, same entity id and path as the approved pin, active, manual, named reviewers (the 3A rule). Revocation (removal, merge, corruption) takes effect on the next read; removing a line from the allowlist or the file takes effect within 5 s.
- **Refused paths cost nothing**: no Mongo command and no rate-limit consumption (tested with command monitoring). Reads and the CLI monitor perform zero writes.
- **Observability.** Per-route counters (served, redirect, `not_allowlisted`, `revalidation_failed`, `integrity_error`, `error`, `killed`, `breaker_open`, `canary_config_invalid`), error rate, ceiling, config error, at admin-only `GET /v2/admin/entities/canary` (no entity content). Other paths share one bucket, so memory is bounded.
- **Error-rate monitoring / breaker.** 5 integrity errors or exceptions within 60 s open an in-process breaker: everything falls back to legacy until restart (`ponytail:` ceiling — per process, not shared).
- **Canonical consistency monitoring.** `content-identity canary-check <allowlist>` (read-only, guarded) revalidates each entry like a read and includes registry-audit blockers touching it; exit 2 on any failure — suitable for cron.
- **Strict noindex.** Unchanged 3A: `X-Robots-Tag: noindex, follow`, meta robots, `no-store`, one self-canonical. **Sitemap exclusion:** `all` excludes every detail path; `canary` excludes exactly the allowlisted paths; caches are partitioned by policy state and allowlist signature.
- **Cache invalidation and SSR restart.** Entity responses are never cached, so killing or revoking is immediate (tested through the production SSR entrypoint). The reverse is not: the legacy response that replaced an entity is cacheable, so **adding an entity needs an SSR restart** (tested: a restarted SSR serves it). `apps/frontend/scripts/entity-canary-verify.mjs` checks status, noindex header and meta, `no-store`, a single self-canonical, a control path, and sitemap exclusion (and `--expect-off` after a kill).

### Canary runbook (for a future, separately authorised rollout — not done)

1. Owner writes the allowlist (≤ 25 verified entities, each with a named approver) and sets `CONTENT_ENTITY_CANARY_MAX`; `canary-check` must exit 0.
2. Set `CONTENT_ENTITY_PUBLIC_READ_ENABLED=true`, `…_SCOPE=canary`, the file and ceiling; restart the API and **SSR**; run `entity-canary-verify.mjs --origin … --allowlist …` (exit 0).
3. Monitor `GET /v2/admin/entities/canary` and `canary-check` every few minutes.
4. Roll back by `touch $CONTENT_ENTITY_KILL_FILE` (instant), then unset the flags and restart; verify with `--expect-off`.

## 6. Content-quality readiness

Criteria, thresholds and tiers: `docs/seo/PHASE-3B-CONTENT-QUALITY-CRITERIA.md`; code `PublicationQuality.ts`. Quality is kept separate from identity and fail-closed. Measured on the 519 accepted works: required metadata present for 92.5 %, but only **49.5 %** also have a ≥ 300-character synopsis, **10.6 %** have a synopsis under 150 characters (AdSense risk high), and 74 % of catalogue rows are sourced `epg`. **No accepted work can be an `index_candidate`**: nothing is human-verified, year provenance is unknown, no internal link points to an entity page and legacy pages stay live. A correctly identified entity is not a page worth indexing.

## 7. Tests, CI and deployment

| Check | Result |
|---|---|
| Backend suite, scratch MongoDB on 127.0.0.1:27118 (per-pid databases, all dropped) | **513 tests: 512 pass, 0 fail, 1 existing Redis skip** (481 before 3B; +32) |
| Backend typecheck (`tsc`, the `lint` script) | PASS |
| New coverage | policy (10 cases: master flag, scope, allowlist shape, ceiling, kill file/env, re-read on change, breaker, stats); canary HTTP integration on scratch MongoDB (allowlist, ceiling, pin mismatch, eligibility revocation, kill, breaker, master flag off, **zero writes**, **zero Mongo commands for refused paths**, `canary-check` CLI exit codes); canonical audit (unit + scratch MongoDB); reviewer ledger (8: roster, tamper detection, corrections, blind second review, adjudication, gate pass/fail matrix, sheet); evidence gate (pathless); quality criteria (7); admin stats route auth; sitemap exclusion in `off`/`all`/no-scope |
| SSR smoke through the production entrypoint (`entity-read-ssr.test.mjs`) | PASS, now including entity cache isolation (kill is immediate) and the restart needed to add an entity |
| `entity-canary-verify.test.mjs` | 3 pass |
| Frontend source | unchanged in 3B (no Karma re-run; unchanged components were not rebuilt locally) |
| `git diff --check` | PASS |
| GitHub Actions on PR #44 (head `67bcfa5`) | `verify` pass (3 m 17 s), `ssr-resilience` pass (1 m 15 s: build, SSR smoke, resilience), `live-crawl` skipped by design |
| Merge | squash `fd021a3` (2026-10-21 17:51 UTC) |
| Deploy run `39647523406` (Deploy a producción) | success; release `20261021195307`, `release.json` gitSha `fd021a38`; rollback target `20261021190805` |

Post-deploy, read-only: API and SSR active; `/health` 200; `GET /v2/entities/resolve` → 404 `ENTITY_PUBLIC_READ_DISABLED` (legacy signal); `GET /v2/admin/entities/canary` without credentials → 401; `/`, `/sitemap.xml`, `/sitemap-programs.xml`, sampled programme pages, `/programacion-tv/peliculas|series|que-ver-hoy`, `/guias` → 200; database baseline identical to before (40 collections, 272 indexes, no `content_*`, 0 airing refs). (`/programacion-tv` and `/que-ver-hoy` are not routes.)

## 8. Production flag state (exact)

Checked by variable **name** only after the deploy (values never read or printed): `/etc/guiatv/api.env` (84 lines), `/etc/guiatv/ssr.env` (3 lines) and the `guiatv-api`/`guiatv-ssr` unit environments contain **no** `CONTENT_ENTITIES_ENABLED`, `CONTENT_IDENTITY_*`, `CONTENT_ENTITY_*` or `EPG_YEAR_PROVENANCE`. All are therefore at their code defaults: **off**. The release behaves as 3A did.

## 9. Open items and blockers

1. **Human gate:** replaced by the owner-authorised AI review (§11): passes with basis `ai`. A persistent write still needs the owner's written go and an attestation path for AI-reviewed identities (Phase 3C).
2. **EPG day volume dropped 25.5 %** for 20261020 between two measurements (11,211 → 8,348 airings). Not caused by Phase 3 (all flags unset, zero writes), but the read-model rebuild or retention for past days deserves a look before comparing days.
3. **Unknown kind is 42 % of candidates** and never proposed; the largest coverage loss.
4. **Year provenance** stays unmeasured until the owner authorises `EPG_YEAR_PROVENANCE`.
5. **Legacy consolidation, internal links and the upcoming-broadcast block** do not exist on the entity page; they gate any indexing.
6. Direct ad-hoc production reads can be refused by the environment's classifier; the packaged runner is the reliable path.

## 11. AI review under the owner's authorisation (2026-10-21)

The owner (manuelxose) authorised AI agents to perform the human review ("toda la revision humana es autorizada por mi para hacerlo por ia"; "ahora te doy la autorizacion"). Policy recorded in the contract (v1.2). The human rule is unchanged where it matters: `normalizeReviewerName` now **also refuses the `AI ` prefix**, so `verifyEntity`, public reads and the canary still need a named person (closing a gap: "AI Sonnet A" used to pass as a person's name). AI reviewers exist only in the ledger/scorer path, with a roster carrying the owner's `aiAuthorization`, an explicit scorer opt-in per call, `reviewerKind: 'ai'` on every entry and `reviewBasis: 'ai'` in reports. Thresholds are unchanged.

**Method.** Each row was checked by fetching its TMDB page (title, original title, year, type, runtime, seasons/episodes). Reviewers: `AI Sonnet 5.5 A` (primary, every row, 12 parallel agents of 30 rows), `AI Opus 5.5 B` (blind second review of 119 rows, a different model and prompt, with an extra web search for ambiguous titles; never shown A's labels), `AI Fable 5.1 C` (adjudicator for rows with no yes/no label). Notes cite what was fetched.

| | Round 1 (pre-fix population) | Round 2 (corrected population, fresh draw) |
|---|---|---|
| Rows / second-reviewed | 360 / 119 | 360 / 119 (246 rows also in round 1, 114 new) |
| Errors found | 1: `la_liberacion` (wrong TMDB work, **critical**) | 1: `la_huella_del_asesino` (`wrong_kind`: a documentary series filed as a scripted series; right work, not critical) |
| Identity precision | 359/360 = 99.7 % (95 % lower 98.7 %) | 359/360 = 99.7 % (95 % lower 98.7 %) |
| Critical ownership violations | **1 → gate blocked** | 0 |
| Reviewer agreement (A vs B, first labels) | 99.2 % identity (a degenerate kappa: every row but one was "accept") | 100 %, kappa 1 (both rejected the same row) |
| Gate (300 labels, 98 %, 50 second reviews, no critical, no open disagreement) | **fail** (critical) | **pass, basis `ai`** |

**Round 1 earned its keep.** Both A and B independently flagged `la_liberacion` (TMDB: 1 season of 7 episodes; the EPG airs T1 E8 and E12) and C rejected it with sources (TMDB, TheTVDB, SensaCine). That exposed a gate defect: the season check passed ("T1 ≤ 1 season") and counted as independent support. Fix: the trace now carries the highest episode number per season, the TMDB check (v3) carries episodes per season, and an episode beyond TMDB's count (+1 slack) is a **contradiction** (quarantine). Effect on the four replay days: −4, −2, −3, −1 accepted identities (131 / 191 / 178 / 172 independently supported). Known cost: long-running daily series that TMDB covers badly (*Sueños de libertad* E672 vs 280, *Autopista hacia el cielo*, *Alerta Cobra*) are now quarantined although probably the right work; coverage is traded for safety. Because the fix changed the population, round 1 could not certify it, so round 2 re-drew and re-reviewed everything.

**Sensitivity control.** A separate calibration (not in any ledger): 12 rows, 6 genuine and 6 whose TMDB link was swapped for another film's. The primary reviewer accepted all 6 genuine and rejected all 6 planted errors. Two rows were also flagged by reviewers as weak evidence and were forced into the second review.

**Limits, plainly.** (1) TMDB is the gate's source and the reviewers' main source: these labels measure coherence with TMDB (plus extra web checks for ambiguous titles), not TMDB's own errors. (2) Same-family models reviewing a pipeline they did not build are not equivalent to independent humans; raw agreement of 100 % on 118 rows says the sample is clean, not that the reviewers are independent. (3) The population is the gate-accepted identities (~516 of ~1,500 proposed per day), not the whole corpus. (4) Nothing here changes production: no flag was touched, no write run, and an AI-reviewed entity still cannot become publicly readable until a Phase 3C change decides how to attest it.

Artefacts: `docs/seo/phase-3b/ai-review/` (ledgers, exports, README), `docs/seo/phase-3b/round2/` (evidence, canonical audits, baselines, replay inputs, sheet).

## 10. Proposed Phase 3C scope (not started)

Only on the owner's explicit go: (a) decide how an AI-reviewed identity is attested for `verifyEntity` and public reads (today both refuse it by design), or accept policy M1; (b) a ≤ 25-entity noindex canary using §5's runbook; (c) entity page content (upcoming-broadcast block, editorial text, links) and a legacy-consolidation plan; (d) `EPG_YEAR_PROVENANCE` for one sync cycle; (e) a separate decision on indexing, with the quality criteria as the gate.
