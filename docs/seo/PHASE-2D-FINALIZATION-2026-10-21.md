# Phase 2D finalization (2026-10-21)

Status legend: **[V]** verified by a run recorded here, **[B]** blocked by the environment, **[P]** proposed, not in force. The Phase 3 contract is [PHASE-3-ENTRY-CONTRACT.md](PHASE-3-ENTRY-CONTRACT.md).

## 0. Summary

- **Engineering readiness for Phase 3: PASS.** Production activation readiness: **BLOCKED** (writes unauthorised, human gate unmet, no fresh production replay).
- One defect found and fixed: **the evidence gate was not connected to the write path.** With the 2D-2 write flags on, every `create` decision of a rebuilt day (about 1,662 on 20261020, of which 163 independently supported, 440 contradictory) would have become a stored entity. Writes now create an entity only for a candidate the gate admitted; a write flag alone creates nothing.
- Raw XMLTV years now reach the identity run (rebuild hook wired), and the flag-disabled recording (PR #41) is merged and deployed.
- Added what the lifecycle lacked: a named-person verification (`verify`), an assurance marker on machine-admitted entities, and a rollback of provisional entities that provably leaves verified identities alone.
- The offline replay of the stored production traces is deterministic and unchanged (163 of 1,662, digest `d35e7caf…`).
- No persistent identity write is enabled in production. Human-validated precision is still unmeasured.

## 1. State found [V]

| Item | State |
|---|---|
| #37 / #38 / #39 / #40 | merged `bf7d047` / `621a2c3` / `33c973d` / `e4e82c4`, all deployed |
| #41 `EPG_YEAR_PROVENANCE` | open, CI green but based on #39: **rebased** onto `e4e82c4` (clean, 3 files), CI green, squash-merged `4f85193`, auto-deployed |
| Production before | release on `e4e82c4`, no `CONTENT_*` and no `EPG_YEAR_PROVENANCE` variable in `api.env` (counted, values not read) |
| Production after #41 | release `20261021182005`, `release.json` gitSha `4f85193`, `/health` 200, still no identity or year variable |
| Readers of entities | none: `ContentIdentityService` is imported only by ingestion and the CLI; no route, SSR, sitemap or canonical code |

## 2. Engineering changes (PR: consolidation)

| Change | Why |
|---|---|
| `ContentIdentityIngestion`: write mode creates an entity only if `candidateId ∈ admit`; others are `unresolved` / `not_admitted`. Shadow ignores the gate and reports what an open gate would do, so replays are unchanged | gate was offline-only |
| `admissionFromEnv` / `CONTENT_IDENTITY_ADMIT_FILE`: reads `evidence --out` verdicts; only `AUTO_ACCEPT` + `independently_supported`; missing, unreadable or broken file admits nothing | one explicit, auditable handoff from evidence to writes |
| `matching.assurance = 'independently_supported'` (optional, additive) on admitted entities | Phase 3 must tell machine-admitted from verified |
| `ContentIdentityService.verifyEntity` + CLI `verify`: candidate → active, named reviewer (automation names refused), records `matching.method = manual`; indexability stays `noindex` | no route to `active` existed besides raw `transition`; verified and machine-admitted looked identical |
| `ContentIdentityRollback` + CLI `rollback [--since] [--apply]`: candidates only, dry run by default | the only rollback was "drop three collections" |
| `TvReadModelBuilder` passes `sourceProvenance.yearProvenance.rawXmltvYear` to `runContentIdentity` | 2D-2G §12 open item; the raw-year evidence leg can now fire once the flag has run |

Unchanged on purpose: shadow output, title parsing, evidence rules, `ContentIdentityAudit.ts` (human scorer), schemas' indexes, all flags' defaults.

## 3. Final identity quality baseline [V offline, B fresh production day]

**Method.** The environment refused to read the production database (the auto-mode classifier blocked `mongosh` over ssh as in earlier sessions); it was not retried or worked around. The baseline is therefore the **stored production traces of 20261020 and five earlier days, re-evaluated offline with this build**: no database, no network. A newer day was not replayed: **[B]**. The packaged owner-run replay is `docs/seo/phase-2d2f/run-evidence.sh`.

| Metric (day `20261020`, built 2026-10-21) | Value |
|---|---|
| Airings | 11,211 |
| Excluded airings | 1,559 (slot 108, unkeyable 36, episode-only 45, sport 1,370) |
| Rejected generic slot titles | 48 |
| Candidates / distinct work keys | 3,187 / 2,970 |
| **Proposed entities** | **1,662** |
| Independently supported (`AUTO_ACCEPT`) | **163 (9.8%)**: 105 films, 57 series, 1 show |
| Machine-supported | 421 (title-only 348, homonyms 72, undecided TV kind 13, film without a check 4; an entity can have several) |
| Contradictory | 440 |
| Insufficient evidence | 638 |
| Candidates never proposed | 1,483 (unknown kind 1,335; uncertain title 119; cross-kind hold 29) |
| TMDB mismatches among proposed | unconfirmed 36, mixed 7, homonyms 72, unstable id 1, slot < runtime 10 |
| Cross-kind conflicts | 30 candidates, 29 held (no entity, no path) |
| Episode-level false entities | 0 accepted (`episodeAsWork` empty); 0 proposed entities whose title re-parses as an episode |
| Canonical collisions | 0 among the accepted; 275 proposed entities had a candidate path refused, resolved by the next safe path or pathless |
| Pathless entities | 224 of 1,662 (213 `historic_unverified`, 5 `historic_ambiguous`, 4 `historic_conflict`, 2 `unsupported_slug`); **0 among the accepted** |
| Gate violations | 0 (all seven classes) |
| Determinism | two offline runs byte-identical (verdicts and summary); verdicts byte-identical to the 2D-2G artefact; digest `d35e7caf3217ffdc…` |

**Comparison with the 2D-2G baseline.** Same denominator (1,662 proposed entities), same evidence rules, same traces and TMDB lookups: identical result by construction. This confirms the build is a no-op for shadow and evidence; it is not a new measurement of production. The 2D-2F rules on the same data accepted 529; 366 of those lacked independent support (2D-2G §0).

Nothing here is human validation. The 2D-2G assistant review of the 163 is advisory and uncounted.

## 4. Tests [V]

| Check | Result |
|---|---|
| `npm run lint:backend` (tsc) | clean |
| Backend `npm test` with scratch MongoDB (`mongod --port 27118`) | **477 tests: 476 pass, 0 fail, 1 skip** (Redis) |
| New `ContentIdentityAdmission.test.ts` (8) | admission file parsing (four failure shapes admit nothing); closed gate creates nothing and shadow still reports the proposals; admitted-only creation with `assurance`, `candidate`, `noindex`; idempotent replay and wider admission adds only the new; provisional never resolves, named verification, automation names refused, `mayBeIndexable` only for the verified; rollback keeps verified, reviewed and airing-referenced entities, dry run changes nothing, resumes after a crash, leaves no orphan slug, is idempotent, and removed identities can be re-admitted; rebuild hook: a write flag alone creates nothing, a file creates only what it lists, raw years reach the run |
| Existing persistence tests (unchanged, all pass) | insertion, duplicate prevention, concurrent creation and allocation, idempotent replay, interruption after every write boundary, canonical ownership, review/rejection, merge/remove/restore, read-only guard |
| Existing tests changed | `ContentIdentityIngestion.test.ts`: helper defaults to `admit: 'all'`; the "write flags before the store is ready" test now supplies an admission file, because without admission the run no longer reaches the store (the safe outcome); nothing weakened |
| SSR `ssr-cache` / `ssr-canonical` | 12/12 |
| GitHub CI on #41 | `verify` and `ssr-resilience` green (re-run on the rebased head) |
| GitHub CI on the consolidation PR | recorded in the PR |

## 5. Quality and quarantine policy

Defined in the contract (§2, §3, §6). In short: only a person makes an entity `active`; the machine can only store a provisional `candidate` with an assurance marker, and only for an `independently_supported` identity; everything uncertain stays quarantined with a reason; nothing in 2D is public or indexed. The human write gate is preserved as is. The machine-only canary (policy M1) is documented separately and **not in force**.

## 6. Remaining quarantine categories (day 20261020)

Unknown kind (1,335), uncertain title separator (119), cross-kind (29), contradictory (440: ownership doubt 222 of which 213 unverified legacy owners, trailing number 64, slot wording 62, editions 37, unstable kind 19, movie with episodes 16, TMDB unconfirmed 36…), title-only (348), TMDB homonyms (72), undecided TV genres (13), insufficient (638).

## 7. Authorisation status

| Item | Status |
|---|---|
| Persistent identity writes in production | **not authorised, not enabled** |
| `EPG_YEAR_PROVENANCE` | code deployed, flag unset; owner decision |
| Human write gate | unmet (0 labels); not asked of the owner |
| Public entity pages, routes, sitemaps | none exist |

## 8. What the owner must still do (only to activate, not to start Phase 3)

1. Decide on `EPG_YEAR_PROVENANCE=true` (changes stored EPG documents).
2. Authorise, or run, `docs/seo/phase-2d2f/run-evidence.sh` for the latest rebuilt day if a fresh production number is wanted.
3. Choose between the human gate and policy M1 before any write canary (contract §8).
