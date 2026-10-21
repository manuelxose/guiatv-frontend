# Phase 2D-2D: production entity quality gate

Branch `feat/identity-quality-gate-2d2d`, from `main` at `6268d46` (PR #36, production release `20261021131440`). Not merged or deployed. No production write, backfill, index, approval, route or indexable URL. Labels: **[V]** verified in this phase, **[E]** estimate, **[P]** proposal, **[U]** unverified, with the reason.

## 1. Baseline [V]

| Check | Result (2026-10-21) |
|---|---|
| `origin/main`, deployed release | `6268d46` (PR #36). `current` → `releases/20261021131440`, `release.json` gitSha `6268d46…` |
| `CONTENT_*` flags | none in `/etc/guiatv/api.env` |
| Collections / indexes, before this phase's runs (12:11 UTC) | **40 / 272**, no `content_*`, `tv_read_airings` 16 indexes, none on `program.entityId`. 0 airings with `program.entityId`, 0 with `program.canonicalPath`. mongod uptime 20.4 h, so no restart since the 2D-2C shadow |
| Same, after both runs (12:23 UTC) | identical |
| Review implementation (before) | `assertReviewer`: case- and whitespace-sensitive, stored the raw value (2D-2C §8) |

**This closes the open item in 2D-2C §6.** The counts were unchanged after the 2D-2C shadow run, and stay unchanged after this phase's runs.

**Historical measurements are not current state.** `20261020` was rebuilt at 2026-10-21 10:16 UTC, after the 2D-2C shadow run at 08:52 UTC. It now has **11,211 airings on 450 channels**, against 11,893 on 448 then. Precompute rebuilds the previous day too, so a day becomes final only on the following day's first cycle.

## 2. Reviewer validation [V]

`normalizeReviewerName` (`ContentIdentityService.ts`) replaces `assertReviewer`. It returns the name to store:
- NFKC normalisation, trimmed, inner whitespace collapsed (`'  Ana  García '` → `Ana García`, full-width `Ｍａｎｕｅｌ` → `Manuel`);
- 2–64 characters from letters, marks, digits, space and `._@'-`, with at least one letter;
- refused, ignoring case: blanks, digits only, `<script>`, zero-width characters, and any name whose whole value or any single word is an automation or service name (`system`, `ingest`, `auto`, `review`, `admin`, `root`, `bot`, `cron`, `ci`, `test`, `claude`, … : `System`, `AUTO `, `ＳＹＳＴＥＭ`, `cron-job`, `ci_bot`, `Auto Review`).

`approve` and `reject` store the normalised name as `review.by` and `decidedBy`. A refused name writes nothing, so an existing verified decision keeps its reviewer and timestamp (test). The review commands are still CLI-only. No route or controller references them (`git diff` touches no HTTP file).

## 3. Read-only sampling tooling [V]

- **Trace.** `ContentIdentityIngestion.run(date, observations, trace?)` fills one `IdentityTrace` per candidate. It is built from the run's own data, and the test shows the same database command count with and without tracing. Fields: original EPG title and up to 5 spellings, normalised key, kind, EPG years, identity year, TMDB ids with evidence status (`confirmed` / `unconfirmed` / `mixed` / `none`), decision, state, method, confidence, reason, proposed identity, proposed path, refused paths, pathless reason, historic owner. A proposed entity is identified as `new:<title-key row id>` rather than a random id, so output is reproducible.
- **Classes** (`ContentIdentityAudit.ts`): `new_entity`, `existing_match`, `tmdb_confirmed`, `tmdb_rejected`, `ambiguous`, `manual_review`, `unknown_kind`, `duplicate_looking` (proposed entities of any kind that share a slug), `shared_title` (one key in several known-kind contexts: remakes, homonyms, splits), `pathless`, `historic_ownership` (path given to the verified historic owner, or refused for a `historic_*` reason), `deferred`.
- **Sampling.** Rows are ranked by SHA-256 of seed, stratum and candidate id, and the lowest `n` are taken. The result is independent of input order, and a larger `n` extends a smaller one with the same seed (tests).
- **CLI.** Usage:
  ```sh
  CONTENT_IDENTITY_MAX_CREATES=100000 node dist/scripts/content-identity.js shadow 20261020 --sample 25 --precision-sample 300 --out <dir> [--seed S]
  ```
  This writes `identity-<date>-<seed>-sample.json` (report, summary, class populations, 25 rows per class) and `identity-<date>-<seed>-review.csv` (the review sheet). `score <sheet.csv>` scores a labelled sheet without touching a database.
- **Read-only enforcement** (`src/scripts/readOnlyGuard.ts`, the 2D-2C `/tmp` preload now in the repo). Every command except `approve` and `reject` installs it before connecting:
  - mongoose `autoIndex` and `autoCreate` are off;
  - command monitoring is forced on;
  - a write, DDL or `$out`/`$merge` command exits with code 97 before it is sent.

  Test (child process): a schema index is not built, a `find` passes, an `insert` exits 97, and the database stays empty.
- **No sensitive data in exports.** No airing, media or entity ids, hosts or settings (test: the sheet has no ObjectId or `ce_` id). The TMDB link is the public page.

## 4. Full-day shadow, production `20261020` [V]

The candidate build was copied to `/tmp/guiatv-2d2d` on the VPS and linked to the release's `node_modules`. No service, release or configuration was touched. The run used:
- `CONTENT_IDENTITY_MAX_CREATES=100000`, every other `CONTENT_*` variable unset;
- `systemd-run --scope -p MemoryMax=1200M --nice=10`, `timeout 600`, `--max-old-space-size=1024`.

It ran twice (12:22 and 12:24 UTC); the second run used corrected class definitions (§9). An ad hoc flag pass (`phase-2d2d/machine-flags.js`) ran a third time.

| Resource | Value |
|---|---|
| Exit | 0, 0 and 0 |
| Wall time | 13.7 s / 8.4 s (`run()` 9.7 s) |
| Peak RSS | 182–184 MB (cap 1,200 MB) |
| Mongo commands | **201, all reads**: `find` tv_read_airings 1, programs 1, media_catalog 2, tv_program_brands 1, content_title_keys 4, content_entities 5, content_slugs 3; `getMore` 183; `endSessions` 1 |
| API | `/health` 200 in 4–7 ms before, between and after |
| Reproducibility | the report from the two runs is identical apart from `durationMs` |

| Metric | 2D-2C baseline (08:52, cap 1,000) | 2D-2D (12:24, no cap) |
|---|---|---|
| Airings | 11,893 | 11,211 (day rebuilt, §1) |
| Excluded: sport / generic / unkeyable | 1,492 / 36 / 41 | 1,370 / 34 / 39 |
| Candidates | 3,763 | 3,839 |
| Unknown kind (unresolved, not stored) | 1,650 (43.8%) | **1,712 (44.6%)**; 1,708 unresolved |
| Kinds: show / series / movie | 1,241 / 498 / 374 | 1,317 / 487 / 323 |
| Airing TMDB ids confirmed / rejected | 910 / 169 (15.7%) | 820 / 161 (**16.4%**) |
| Decisions: create / bind / review | 2,110 / 3 / 2 | **2,121 / 5 / 5** |
| Simulated / deferred | 1,000 / 1,110 | **2,121 / 0** |
| New entities by kind | not measured | show 1,313, series 487, movie 321 |
| By method | not measured | title-only 1,822 (85.9%), confirmed TMDB 299 (14.1%) |
| Review rows | 2 ambiguous | 4 ambiguous (`several_entities`), 1 manual review (`kind_conflict`) |
| With a path | 876 of 1,000 | **1,908 of 2,121**; 1,430 to the verified historic owner |
| Pathless | 12.4% of 1,000 | **10.0%**: `historic_unverified` 201, `historic_ambiguous` 7, `historic_conflict` 3, `unsupported_slug` 2 |
| Candidate paths refused | — | `historic_unverified` 247, `historic_ambiguous` 19, `historic_conflict` 3, `unsupported_slug` 2, `inventory_review` 1 |
| Storage estimate [E] | 1.5 MB | 3.2 MB |
| Writes | 0 | 0 |

The cap hid nothing harmful: with all creations simulated, the pathless rate is lower than in the first-1,000 subset.

## 5. Sample composition [V]

`docs/seo/phase-2d2d/identity-20261020-20261020-review.csv` (seed `20261020`) has 460 rows, each candidate once, with the strata it was drawn for:

| Stratum | Rows | Population |
|---|---|---|
| `auto_create`, simple random sample | **300** | 2,121 (14.1%) |
| `new_entity` | 25 | 2,121 |
| `tmdb_confirmed` | 25 | 300 |
| `tmdb_rejected` | 25 | 86 |
| `duplicate_looking` | 25 | 28 |
| `shared_title` | 25 | 46 |
| `pathless` | 25 | 213 |
| `historic_ownership` | 25 | 1,703 |
| `unknown_kind` | 25 | 1,708 |
| `ambiguous` / `manual_review` / `existing_match` | 4 / 1 / 5 | census |
| `deferred` | 0 | 0 |

The auto-create sample tracks the population:

| | Sample | Population |
|---|---|---|
| show / series / movie | 63.7 / 19.3 / 17.0% | 61.9 / 23.0 / 15.1% |
| title-only / TMDB | 87.0 / 13.0% | 85.9 / 14.1% |
| with a path | 272 (90.7%) | 90.0% |

The JSON file holds the class populations and 25 rows per class.

## 6. Reviewed versus unreviewed evidence

| Evidence | Status |
|---|---|
| Human labels | **None.** 0 of 460 rows are reviewed. `score` on the sheet: `reviewed: 0`, gate `pass: false` |
| Machine decisions | Not counted as labels. `score` ignores any row without a label, and any label without a valid reviewer name |
| Machine flags (§7) | Heuristic pattern matches over all 2,121 proposed entities, `machine-flags-20261020.json`. They are **not** labels, and they **are** enough to show systematic errors |

## 7. Precision estimates and uncertainty

**Measured identity precision: none. No row has a human label.** The figures below are machine flags and the interval arithmetic for the planned sample.

### Machine flags over the full day [V], not ground truth

| Flag | Proposed entities | Examples (title → proposed path) |
|---|---|---|
| Subtitle separator ` · ` / ` - ` | 407 | `9-1-1 T4 E3 · El futuro` → `/series/9-1-1-el-futuro`; `A pedir de boca - Setas de otoño` → `/programas/a-pedir-de-boca-setas-de-otono` |
| Season/episode marker in a spelling | 322 | `A un paso del cielo T5 E20 · El hijo 2` → `/series/a-un-paso-del-cielo-el-hijo-2` |
| Trailing number | 127 | `Amanda y Alan: reformas a la italiana T1 · 4`, `· 5`, `· 6`, `· 7` → four entities and four paths |
| `Ep09` / `Episodio 770` | 34 | `Alerta Cobra T22 Ep09` → `/series/alerta-cobra-ep09` |
| `(171) 7` part numbers | 10 | `Autopista hacia el cielo (171) 7` → `/series/autopista-hacia-el-cielo-171-7` |
| Slot or container words | 6 | `Repetición de programas`, `Programación local`, `Avance Informativo`, `+ Que Cine` |
| Date in title | 1 | `Un día en la Historia de España: 20 de octubre de 1982` |
| **Any flag** | **657 of 2,121 (31.0%)**; 617 of them with a path | |

Flags overlap, and some are false. "Agatha Christie: Poirot" is flagged through a `T…E…` spelling but is a real series title. Even so, the cause is structural: `titleIdentityKey` strips `T4 E3` but keeps the episode subtitle after it. Every episode of a series that carries its episode title in the EPG title becomes its own entity with its own `/series/…` path.

**Cross-kind splits [V].** There are 14 slug groups: series+show 10, movie+show 2, movie+series 2. That is 28 proposed entities, and in 9 groups both entities get a path. Examples:
- `/series/la-aventura-del-saber` and `/programas/la-aventura-del-saber`;
- `/series/diagnostico` and `/programas/diagnostico`;
- `/series/cuando-los-muertos-hablan` and `/programas/cuando-los-muertos-hablan`;
- "La gran belleza" (Sorrentino's 2013 film) also as a title-only `/series/la-gran-belleza`.

The kind comes from each channel's category, so one work aired as "Series" on one channel and "Entretenimiento" on another becomes two entities. Their unknown-kind airings then go to review as `several_entities` (4 rows).

**Unconfirmed TMDB ids stay out of identity [V].** 86 candidates were tagged `unconfirmed` or `mixed`; none got a TMDB-backed decision, and they were matched as title-only. Their titles are dominated by episode-level spellings (`Rosario (76) 12`, `Boardwalk Empire T2 E1 · 21`), which matches the enrichment bug in 2D-2 §A.

### What the planned sample can show [V], from `clopperPearson` in `ContentIdentityAudit.ts`

| Correct / reviewed | Observed | Exact 95% CI | One-sided 95% lower bound |
|---|---|---|---|
| 300 / 300 | 100% | 98.8–100% | 99.0% |
| 297 / 300 | 99.0% | 97.1–99.8% | 97.4% |
| 294 / 300 | 98.0% | 95.7–99.3% | 96.1% |
| 50 / 50 | 100% | 92.9–100% | 94.2% |
| 30 / 30 | 100% | 88.4–100% | 90.5% |

- A small sample with zero errors does not show precision above 98%. 30/30 supports only 90.5%; 150 errors-free rows are needed for a 98% one-sided bound.
- The intervals ignore the finite-population correction (n = 300 of N = 2,121), so they are slightly conservative.
- [E] If the machine flags were even half right (about 15% episode-level entities), the expected observed precision is about 85%. That is far below the 98% target, before kind and duplicate errors are counted.

## 8. Ambiguous and pathless categories [V]

- **Ambiguous (4):** "Diagnóstico", "La Revuelta", "Cara a cara", "La aventura del saber". All are unknown-kind sightings of a title that this day also proposed under two kinds (series+show, or movie+show for "Cara a cara"): the cross-kind split above.
- **Manual review (1):** "Wonderblocks", `kind_conflict`: a confirmed TMDB TV id already claimed earlier in the run by a candidate of another kind.
- **Pathless (213, 10.0%):** all intentional reasons.
  - `historic_unverified` 201: title-only films without a year, and series/shows whose slug a TMDB TV work answers.
  - `historic_ambiguous` 7, for example "Caso cerrado", where several TMDB works answer the slug.
  - `historic_conflict` 3; `unsupported_slug` 2 (digits-only titles).
  - No `taken` and no `write_failed`.
- **Historic ownership:** 1,430 paths go to the verified historic owner. 3 candidate paths were refused because another legacy title answers the slug. By construction (`planCanonicalPaths`), no path whose legacy owner is another work was allocated. Whether the 1,430 "verified" owners are right is part of the human review (`path_ok`, `critical`).

## 9. Review protocol

**Owner:** the project owner, or an editor they name. Labels go in the CSV's last eight columns; machine columns stay unedited.

| Column | Values | Meaning |
|---|---|---|
| `reviewer` | a person's name | must pass `normalizeReviewerName`; a row with labels and no valid name is counted as unsigned and blocks the gate |
| `identity_ok` | `y` / `n` / `?` | `y` only if the proposed entity is exactly one work (film, series or programme), not an episode, a slot, a container, or two works merged |
| `kind_ok` | `y` / `n` | the kind is right |
| `duplicate_of` | text | another title or entity this one duplicates (another spelling, the series/show twin, an episode of a series) |
| `tmdb_ok` | `y` / `n` / `na` | for `tmdb_evidence=confirmed`: the TMDB page (`tmdb_url`) is this work |
| `path_ok` | `y` / `n` / `na` | the proposed path belongs to this work and not to another one |
| `critical` | `y` | with `path_ok=n`: the path is a historic URL of a different work (a canonical-ownership violation) |
| `notes` | text | |

**Procedure:**
1. Label every `auto_create` row: 300, no skipping. A skip turns a simple random sample into a convenience sample.
2. Label every high-risk row (`duplicate_looking`, `shared_title`, `tmdb_rejected`, `ambiguous`, `manual_review`, `historic_ownership`, `pathless`). These are reported per stratum as error counts, never pooled into precision.
3. Run `node dist/scripts/content-identity.js score docs/seo/phase-2d2d/identity-20261020-20261020-review.csv`. It exits 0 when the gate passes and 2 when it does not.
4. A second reviewer re-labels 50 random `auto_create` rows. Report agreement, and resolve disagreements before scoring.

**Metrics** (`scoreReview`):
- identity precision with exact 95% CI and the one-sided lower bound;
- kind accuracy;
- duplicate rate;
- TMDB assignment correctness (incorrect rate = 1 − observed);
- canonical ownership accuracy;
- identity by decision method;
- error counts per stratum and critical violations.

Missing paths by reason come from the machine summary (§4), because a path's absence is not a judgement.

**Gate** (`gate.pass` in the `score` output): all 300 `auto_create` rows labelled `y`/`n`, observed identity precision ≥ 98%, 0 critical ownership violations, and no unsigned labels. Report the one-sided lower bound next to it. A pass at 294/300 supports only about 96% with 95% confidence.

**Re-sampling after a fix:** the same command with a new seed, on a day that is final after its next-day rebuild. A changed classifier changes the population, so earlier labels do not carry over.

## 10. SEO protection [V]

| Check | Result |
|---|---|
| Simulated entities non-indexable | every new row is `candidate` (2,126) / `ambiguous` (4) / `manual_review` (1), and none is `verified`. Confidence is ≤ 0.9 (TMDB) or ≤ 0.8 (title). `mayBeIndexable` needs `active` plus manual review or ≥ 0.95 |
| Public routes, sitemaps, SSR, canonical code | unchanged: the diff touches `ContentIdentity*`, `scripts/content-identity.ts`, `scripts/readOnlyGuard.ts`, tests and docs only |
| Canonical given to another historic work | none by construction (3 refusals); the human check is `path_ok`/`critical` |
| Unknown kinds | 1,708 unresolved, none stored |
| Low-confidence TMDB matches | never verified automatically; 86 unconfirmed ids ignored |
| Thin autogenerated pages | none public: no route reads entities. **Before any public phase (2D-3):** the episode-level and slot entities (§7) would be exactly that, so they must be fixed or excluded first |

Data matching is not AdSense evidence: these entities have no original content yet.

## 11. Tests [V]

| Check | Result |
|---|---|
| Backend `tsc` lint | pass |
| Backend `npm test` with `TEST_MONGO_URI` (scratch mongod 8.0) | **444: 443 pass, 0 fail, 1 skip** (Redis) |
| New pure tests (`ContentIdentityAudit.test.ts`) | reviewer names (7 valid, 29 refused); seeded, order-independent, extendable samples; CSV round trip with quotes and newlines; exact intervals against closed forms; scoring gate (unsigned labels, critical violation, unresolved rows, precision below target) |
| New Mongo cases (`ContentIdentityIngestion.test.ts`) | shadow sample: same command count, no collection, identical traces in reverse input order, every class, same-run bind identity, no ids in the sheet, machine output never scored; read-only guard (child process, exit 97, nothing created); reviewer: reserved names refused in any case, verified decision untouched, normalised name stored |
| Concurrency, crash recovery, remakes, historic ownership, pathless (existing) | pass, in the 443 |
| `ssr-canonical.test.mjs` / `ssr-cache.test.mjs` | 8/8, 4/4 |
| Production shadow verification | §4 (201 reads, 0 writes, counts unchanged) |
| **Not run** | Karma, `ng build --ssr`, `seo-ssr-resilience` and a crawl: no frontend, SSR or infra file changed, and CI runs them on the PR |

## 12. Remaining blockers

1. **Episode-level identities [V]:** 31% of proposed entities are flagged, and the cause is structural (§7). Fixing it needs `titleIdentityKey` and `slugifyEntityTitle` to drop the episode part after ` · `, ` - `, `T\d+` / `Ep\d+` and `(\d+) \d+`. Changing the key changes every identity, so it needs a design decision and parity tests against the 2C slug inventory.
2. **Cross-kind splits [V]:** 14 groups per day, 9 with two canonical paths. Options: kind from the work, not the channel category (TMDB type, or the most frequent category across a window); or one entity per key across series/show, with the prefix decided once (2C §P.2).
3. **No human labels [V]:** precision, kind accuracy, duplicate rate, TMDB correctness and ownership accuracy are unmeasured.
4. **Slot titles [V]:** `Repetición de programas`, `Programación local` and `Avance …` are not generic under `isGenericContentTitle`.
5. Carried over: 44.6% unknown kind, by design; TMDB enrichment bug (16.4% of tagged airings unconfirmed); `assistant_operational_events` TTL decision.

## 13. Write-mode decision: **NO-GO** [V]

- Execution is not the problem: 201 reads, 0 writes, 184 MB, about 10 s per day.
- The decisions are. About a third of the automatic creations are episode-level or slot entities, and 14 works per day split across kinds. Writing them would store duplicates that are hard to merge later. Each would hold a canonical path in the insert-only slug registry, and those paths would block or confuse the correct owner later (2D-2 §E: registry inserts only).
- This holds without human labels: the flagged share is far beyond the 2% error budget even if most flags were wrong.

## 14. Next steps [P], each with separate authorisation

**2D-2E: title normalisation.** Fix blockers 1, 2 and 4 in the domain:
1. Re-run this tool on a final day with a new seed. Expect machine flags under 2% and no cross-kind path pairs.
2. The owner labels the 300-row sample (§9) until the gate passes.

**First write canary**, only after that gate passes:
1. Take a `mongodump` of the database, and confirm that one collection restores to a scratch `mongod`.
2. For **one** precompute cycle:
   - set `CONTENT_ENTITIES_ENABLED=true`, `CONTENT_IDENTITY_WRITES=guiatv` and `CONTENT_IDENTITY_MAX_CREATES=200`;
   - leave `CONTENT_IDENTITY_AIRING_REFS` unset, and build no index.
3. [P] Optional narrower first cycle: confirmed-TMDB creations only (299 per day). This needs a small `CONTENT_IDENTITY_CREATE_METHODS` filter that does not exist yet.
4. Verify:
   - `content_*` counts equal the report's `writes.*`;
   - `pathless` audit and review queue as predicted by the shadow run of the same day;
   - API p95 and 5xx unchanged, crawl unchanged, 0 `failed`, 0 `duplicateKeyConflicts`, 0 `claimConflicts`.
5. Roll back if any of those checks fails, or if precompute duration changes by more than 10%. Rollback: unset the variables and restart. The 3 `content_*` collections can be dropped, because nothing public reads them.

## 15. Artefacts

| File | Contents |
|---|---|
| `docs/seo/phase-2d2d/identity-20261020-20261020-review.csv` | review sheet, 460 rows, labels empty |
| `docs/seo/phase-2d2d/identity-20261020-20261020-sample.json` | run report, summary, class populations, 25 rows per class |
| `docs/seo/phase-2d2d/machine-flags-20261020.json` | flag counts, examples, cross-kind groups |
| `docs/seo/phase-2d2d/machine-flags.js` | ad hoc, read-only flag pass (copy into `apps/backend`; guard installed) |
| Server `/tmp/guiatv-2d2d/` | outputs and logs of the three runs; the candidate `dist` was removed afterwards |
