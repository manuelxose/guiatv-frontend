# Phase 2D-2: persistent entity ingestion integration

Branch `feat/persistent-content-ingestion-2d2`, from `origin/main` at `8661f3e` (PR #33). Local only: not pushed, merged or deployed. With every new flag unset, this branch behaves like 2D-1 (§C, §K).

Labels used below: **[V]** verified by a test or measurement in this phase, **[P]** proposal, **[E]** estimate or projection.

## Baseline [V]

- `origin/main` = `8661f3e` (PR #33 merge); PR #32 = `af476d2`. No newer commits.
- Production release `20261021003516`. `CONTENT_ENTITIES_ENABLED` is absent from `/etc/guiatv/api.env`, there are no `content_*` collections, and `tv_read_airings` has 16 indexes, none of them an entity index (read-only check, 2026-10-21).
- Untracked `PHASE-1-AUDIT`, `PHASE-2C-ARCHITECTURE` and `phase-2c/` files were left untouched.
- Skills applied: `mk-site-architecture` (historic URLs stay with their work, no reassignment), `mk-programmatic-seo` (slots and unknown kinds never become entities; everything stays `noindex`) and `seo-technical` (single-hop design, no redirects published). No subagents, no new dependencies, no paid services.
- Data used: index metadata only from production (no documents). Real-data tests ran against a `mongodump` of the **local** development database (EPG through 2026-09-07), restored into a scratch `mongod`. No other production reads.

## A. Current ingestion integration points [V]

XMLTV → `SyncEPGData` (parse, normalise, TMDB enrichment → `programs`) → `PrecomputeSchedule` → `TvReadModelBuilder.rebuildDate(date)` (builds airings, `deleteMany`/`insertMany` on `tv_read_airings`, upserts `tv_program_brands`, clears caches) → API/SSR.

**Integration point:** the end of `rebuildDate`, after the day's airings and brands are stored and before the cache clear. Reasons:

- The schedule is already written when identity runs, so an identity failure can't block the day.
- It sees the final, deduplicated airings, so there is one pass per day rather than per programme.
- It sits next to the only writer of `tv_read_airings`, which the airing references need.

Findings that shaped the design:

- `enrichProgramsWithTMDB` keeps the **last search result even when no alias passed `titleMatches`**, and `titleMatches` accepts substring and edit-distance matches. A TMDB id on an airing is therefore not identity evidence. Ingestion re-confirms it (§D). The enrichment itself is unchanged.
- The read model's `titleResolutionState` comes from `isGenericMovieTitle` and marks "Cine de barrio" as `generic_unresolved`. Ingestion ignores that state and applies its own generic rule. This was caught by the EPG parity test.
- `editorialCategory` is partly derived from the title (`inferEditorialCategory`), so the kind classifier treats it as weak evidence.

## B. New processing architecture

| Layer | File | Role |
|---|---|---|
| Domain | `domain/services/contentIdentity.ts` | `classifyContentKind`, `slugifyEntityTitle`, `entityCandidatePaths`, `legacyCatalogSlugs`, `decideIngestionMatch`, `rejected` state, title-key length cap |
| Contracts | `domain/repositories/IContentIdentityRepository.ts` | Batch reads (`listByKeys`, `findByIds`, `findLiveByTmdbRefs`, `findByPaths`), `touch`, `reject`, evidence source, airing-ref writer |
| Adapters | `infrastructure/repositories/MongoContentIdentityRepositories.ts` | `$in` batches of 1000, catalogue evidence, historic-slug index, airing-ref `bulkWrite`, index readiness |
| Application | `application/services/ContentIdentityIngestion.ts` (new) | The day resolver and its report; `runContentIdentity` (never throws) |
| Service | `ContentIdentityService.ts` | `ensureEntity(input, id?)` (idempotent by id), `rejectTitleKey`, named reviewer required |
| Flags | `shared/config/contentEntities.ts` | §C |
| Pipeline | `TvReadModelBuilder.ts` | +5 lines: remembers the EPG year per airing and calls `runContentIdentity` |
| Ops CLI | `scripts/content-identity.ts` (new) | `shadow <from> [to]`, `queue`, `approve`, `reject`. No HTTP endpoint |
| Index names | 6 model files | §I |

Steps for one day (`ContentIdentityIngestion.run`):
1. Exclude unkeyable, generic and sport titles (no I/O).
2. Read catalogue evidence in one query; confirm TMDB ids; classify the kind; group airings by `key|kind|tmdb|year`.
3. Read existing title keys and TMDB owners: one `$in` per 1000 keys.
4. Decide each candidate in a deterministic order (key, then TMDB-backed, then dated first). Each new row is visible to the next decision.
5. Materialise the entities behind claimed rows, and any a crash left behind.
6. Allocate canonical paths for live, pathless entities.
7. Write airing references (only with the flag and the index; §I).
8. Touch `lastSeenAt` on the rows seen.

## C. Feature flags and activation matrix [V]

| Variable | Effect | Requires |
|---|---|---|
| `CONTENT_ENTITIES_ENABLED` (2D-1) | Boot creates the 3 empty collections and their indexes | — |
| `CONTENT_IDENTITY_SHADOW` | Matching per rebuilt day, aggregate log line, **reads only** | — |
| `CONTENT_IDENTITY_WRITES` | Persists entities, slugs and title keys | The 2D-1 flag, **and the value must equal the connected database name** (`true` never enables writes) |
| `CONTENT_IDENTITY_AIRING_REFS` | Writes `program.entityId` and `canonicalPath` on airings | Writes, plus `idx_tvread_entity_start` existing exactly as specified (checked each run) |
| `CONTENT_IDENTITY_MAX_CREATES` | Cap on new entities per run (default 1000; the rest are deferred) | — |
| Public resolution | **No flag exists.** No route, sitemap, SSR or frontend code reads entities, so no environment value can publish one | — |

| State | Behaviour |
|---|---|
| All off | `runContentIdentity` returns before any query. Stored airings are identical (parity test) |
| Shadow | Same decisions as write mode, simulated in memory. Creates no collection, index or document (test asserts `content_*` absent) |
| Writes, store not ready | `ContentIdentityNotReadyError` → logged, day unaffected, no implicit collection creation (test) |
| Writes | Entities are `candidate`/`noindex`; nothing is verified automatically |
| Writes + refs, index missing | Refs skipped (`index_missing`), no airing touched (test) |

## D. Identity resolution rules

All 2D-1 policies are reused unchanged through `decideTitleMatch`: composite keys, same-year binding, ±1 year to review, TMDB type check, conflicting TMDB ids to review, sticky rows, verified rows never overwritten. New in 2D-2:

- **TMDB evidence [V].** An airing's `tmdbId` counts only when exactly one `media_catalog` row has that id (and the airing's `mediaId`, if present) **and** the same title key as the airing (title or original title). For films, the EPG year must also be within ±1. A confirmed id gets method `tmdb_exact` and confidence 0.9, below the 0.95 verified threshold. A search result alone is never enough to verify, and `mayBeIndexable` stays false until a person reviews it. Unconfirmed ids are ignored and the title is matched on its own (local replay: 18–25% of TMDB-tagged airings unconfirmed).
- **Kind [V].**
  - A confirmed TMDB `movie` is a movie. A TMDB `tv` is a series when the category is Series or Infantil, otherwise a show.
  - Without TMDB, the category decides: Series is a series. Cine is a movie, unless the title key has a standalone `cine` token, in which case it is a show ("Cine de barrio", "Historia de nuestro cine"; "Cinema Paradiso" stays a movie). Programme-only categories (news, entertainment, sport without a facet, music, culture, religion, décor) are shows.
  - Infantil, Documental, Otros and unmapped categories are **unknown**.
  - Sport airings with a `sportFacet` are excluded (2C §E.4).
- **Unknown kind [V].** Never creates or binds. Counted as `unresolved` / `unknown_kind` and **not stored**: it would be about 45% of a day's titles (§J) and would flood the queue. It resolves once the title appears with a known kind or TMDB evidence.
- **Generic titles [V].** `isGenericContentTitle` (bare slot words; "Cine: <film>" containers). Non-Latin and unkeyable titles are excluded. Titles whose key exceeds 120 characters are excluded: real EPG rows glue the synopsis onto the title.
- **Grouping [V].** Airings merge only when key, kind, TMDB work and year all agree. The shortest spelling becomes the entity title ("La Promesa" over "La Promesa T1 E929").

## E. Slug allocation rules [V]

- **Slug** (`slugifyEntityTitle`): lower-case; apostrophes and dots joined (`greys-anatomy`, `csi-miami`); ø/æ/œ/ß/ł/đ/þ transliterated; then the title-key rules, which fold accents and drop season, episode and edition markers. Null for non-Latin, digits-only, reserved or empty results. At most 80 characters, cut at a hyphen.
- **Candidates:** `/{peliculas|series|programas}/{slug}`, then `-{year}` **only when the year comes from TMDB or a film's EPG year**. There is no counter fallback (2C §F.4's `-2` is dropped as silent collision resolution). When every candidate is taken, the entity stays pathless and is counted as a collision.
- **Historic URLs:**
  - An in-memory index maps every slug the legacy pages could answer (`CatalogService.slugify` and `slugifyTitle`, mirrored by `legacyCatalogSlugs` with a parity test) to the title keys of the works that produced it. Its sources are all `tv_program_brands` titles plus `media_catalog` titles and original titles.
  - A candidate is allowed only if every historic owner includes this entity's key. Example from the test: "No" doesn't get `/programas/no`, because legacy "Noé" also answered it.
  - The 2C legacy mapping CSV is not read: those mappings remain 2D-3 inputs, not redirects.
- **Stability:** registry inserts only, one canonical per entity, and the existing 2D-1 guarantees. Pathless entities are retried on later runs with the same deterministic candidates, never a new spelling.
- No redirect, `gone` or public path is created in 2D-2.

## F. Matching and review workflow [V]

- **Review items** are `content_title_keys` rows with deterministic id `key|kind|discriminator`. They are insert-only, so repeated runs never duplicate them.
  - `manual_review` reasons: `tmdb_conflict`, `kind_conflict`, `tmdb_type_mismatch`.
  - `ambiguous` reasons: `several_entities`, `year_adjacent`.
  - Each row keeps `candidates` (entity ids), `method`, `confidence` and the discriminator as evidence.
  - Low-confidence bindings are `candidate` rows (title-only, ≤ 0.8; confirmed TMDB, 0.9).
- **Approve:** `content-identity approve <id> <entityId> --by <name>`, which calls the existing `reviewTitleKey` and sets the row to verified/manual.
- **Reject:** `content-identity reject <id> --by <name>` sets the new `rejected` state. Rejected rows stay unbound, are `held` by later runs, and drop out of the queue index.
- Both need the write flags and a named reviewer. `''`, `system`, `auto` and `ingest` are refused, and there is no default reviewer.
- There is no HTTP endpoint.
- Default owner: the project owner, or an editor they name.

## G. Database interactions [V]

Per day: about 3 + 3·⌈candidates/1000⌉ reads. Writes:
- Title-only entity: 1 row insert, 1 entity insert, then `allocateCanonicalPath`.
- TMDB entity: entity first, then row.
- Plus one `updateMany` per 1000 seen rows, and optional `bulkWrite` refs.

`tv_read_airings` gets no new reads. Historic-slug index: one cursor over brands and catalogue every 6 h per process.

## H. Concurrency and idempotency [V]

- **Title-only works:** the title-key row is the claim. The loser of a concurrent insert receives the winner's row and entity id. Entity insert is idempotent by id (`ensureEntity(input, id)`), so whichever process materialises first wins and the other reads it back.
- **TMDB works:** entity first. The TMDB partial unique index picks one winner across processes, so a row never points at a missing entity.
- **Crash recovery:** a row whose entity is missing is materialised on the next run; an entity without a path gets its path on the next run.
- **Failure isolation:**
  - A single candidate whose write fails is skipped and counted as `failed`, and the rest of the day resolves.
  - A not-ready store aborts the identity step only.
  - `rebuildDate` never sees an identity exception.
- **Tests:** two rebuilds of different dates in parallel (60 shared titles) gave 60 entities, 60 slugs, 0 duplicates. A rerun of the same day gave 0 writes. Both partial-crash shapes recover. The per-run cap defers creations and the next run catches up.
- **Local replay:** a rerun of a fully created day (`parallel 20260907`) made 0 writes in 31 commands.
- **Known edge:** a row can point at an id that never materialises only if two processes create entities for the same TMDB work under different title keys at the same instant. The run counts it in `claimConflicts` and logs it.

## I. Index safety [V]

**Airing entity index.** Unchanged definition: `{ 'program.entityId': 1, 'airing.start': 1 }`, partial `{ 'program.entityId': { $exists: true } }`, name `idx_tvread_entity_start`.
- Still not on the schema. A test asserts the planner picks it.
- Boot never creates it.
- Refs refuse to write unless it exists with exactly this key and filter.

Approved future sequence [P], none of it done here:
1. Confirm a `mongodump` of `tv_read_airings` and that restore works.
2. Confirm the definition above.
3. Pick a low-traffic window (04:00 Madrid).
4. Build it as a separately authorised operation, monitoring `db.currentOp({'command.createIndexes': {$exists: true}})`.
5. Verify with `getIndexes()` and an `explain` of `find({'program.entityId': X}).sort({'airing.start': 1})`.
6. Register the spec on the schema. Boot uses `createIndexes` and never drops anything.
7. Only then set `CONTENT_IDENTITY_AIRING_REFS`.

**Boot warnings ("Index already exists with a different name").**
- Cause: these are not duplicate declarations. `scripts/create-indexes.ts` renamed 22 indexes in 6 collections (`channels`, `programs`, `user_content_interactions`, `user_assistant_conversations`, `user_assistant_memory`, `tv_program_brands`) to `idx_*` names, while the schemas kept mongoose's default names.
- Production consequence: `createIndexes()` aborts at the first conflict in each collection, so a schema index added later to one of these collections would silently never be built in production.
- Fix: the schemas now declare the live names.
- Verified against index metadata read from production: `docs/seo/phase-2d2/check-index-names.cjs` with `production-index-specs-2026-10-21.json` checks 59 indexes, 0 mismatches. Keys and options are identical, so the next boot is a no-op for these 22 indexes and drops nothing.

**Not changed:** `assistant_operational_events` declares `{createdAt: 1}` twice (the mongoose duplicate warning): plain, and a 30-day TTL. Production holds the **non-TTL** `createdAt_1`, so the intended 30-day retention has never applied. Removing either declaration changes intended retention semantics, so this is left for a decision (§N).

WiredTiger cache: unchanged.

## J. Performance measurements

**Local replay of real EPG days [V]** (scratch `mongod` 8.0.29, 0.25 GB cache, WSL; `replay-local-20260903-07.jsonl`):

| Day | Airings | Candidates | Shadow | Write | Notes |
|---|---|---|---|---|---|
| 09-03 (first) | 9,589 | 3,732 | 341 ms, 32 cmds, RSS +76 MB | 2.9 s, 5,019 cmds | 1,000 created (cap), 960 deferred |
| 09-04 | 10,760 | 3,337 | 156 ms, 19 cmds | 3.0 s | 466 matched, 1,000 created |
| 09-05 | 12,233 | 4,263 | 184 ms, 22 cmds | 3.1 s | 666 matched |
| 09-06 | 9,048 | 3,289 | 153 ms | 3.1 s | 730 matched |
| 09-07 | 5,728 | 1,702 | 99 ms | 1.4 s | 777 matched, 461 created |
| 09-07 rerun | 5,728 | 1,702 | — | 249 ms, 31 cmds | 0 writes |

- Final state after 5 days, reruns and the parallel run: 5,317 entities, 5,312 slugs, 5,347 title keys, 18 review rows, 0 failures, 0 duplicate-key conflicts.
- Storage: 5.7 MB data plus 2.6 MB indexes, about 1.57 KB per entity.
- Candidate mix per day: about 45% `unknown` kind (unresolved), 10% sport airings excluded, under 1% generic.
- **Synthetic load [V]** (9,000 airings, 3,000 candidates): shadow 158 ms / 10 cmds; first write 6.4 s / 10,007 cmds (2,000 entities, about 5 commands each); rerun 166 ms / 14 cmds.
- **Flags off [V]:** zero identity queries; the rebuild path is unchanged apart from one `Map.set` per airing.
- **Baseline vs candidate:** the identity step is additive and runs after the day is stored, so the baseline rebuild time is unchanged. A full `rebuildDate` timing against production-sized data was not measured.

**Production estimates [E]:**
- Prod days average 9,583 airings (2D-1 §G), so per-day cost should be similar to the replay: shadow about 0.2 s; write about 3 s while new entities still exceed the cap, then under 1.5 s.
- 2D-1 put the upper bound at about 62k non-sport keys in 90 days. Minus about 45% unknown, that is roughly 30–35k entities, about 50 MB with indexes.
- Review queue: replay growth was about 3–6 rows per day.
- **Historic-slug index memory is unmeasured at production scale:** production has 150,797 brands against 11,849 locally (13×). The first local shadow run grew RSS by 76 MB, including module warm-up. Measure this before enabling shadow in production, or store legacy slugs on `tv_program_brands` (the upgrade path in the code comment).

## K. Test results [V]

| Check | Result |
|---|---|
| `tsc` lint | pass |
| Backend `npm test`, no Mongo (CI before 2D-1) | 392 tests: 389 pass, 0 fail, 3 skip |
| Backend with `TEST_MONGO_URI` (scratch 8.0.29) | 421 tests: 420 pass, 0 fail, 1 skip (Redis) |
| New pure tests (`contentIdentity.test.ts`) | slugs, candidate paths, legacy-slug parity with `CatalogService`, kind classification, unknown kind, flag matrix |
| New Mongo suite (`ContentIdentityIngestion.test.ts`, 13 subtests) | shadow without writes; store-not-ready isolation; write plan equals shadow plan; idempotent rerun; parallel dates; crash recovery; failing candidate isolated; creation cap; airing refs gated on index and planner use; review approve/reject; EPG output parity (off / shadow / write+refs); high volume |
| Index names vs production metadata | 59 checked, 0 mismatches |
| `test:deploy` | pass |

Coverage of the requested cases:
- Accented, non-Latin, remakes (Cenicienta 1950/2015 get `cenicienta` and `cenicienta-2015`), distinct TMDB ids (La novia gets `tmdb_conflict`), aliases (C.S.I. Miami and CSI: Miami give one entity, two rows).
- Named slot vs generic ("Cine de barrio" vs "Cine", "Película").
- Unconfirmed TMDB id, and a historic URL conflict.

## L. SEO and SSR regression [V / not run]

- `git diff origin/main -- apps/frontend scripts e2e infra .github` is empty. No route, controller, sitemap, SSR or frontend file changed. No entity is readable through any public path.
- **Not run locally:** frontend Karma, `ng build --ssr`, `seo:ssr-resilience`, the canonical matrix and `seo:crawl` against a candidate. WSL had about 200–500 MB free (two `tsc` runs were OOM-killed in this session). The frontend bytes are identical to `main`, which passed CI and deploy. On a PR these run in CI (`performance.yml`, `seo-regression.yml`). A crawl of a flags-off candidate would exercise unchanged code.

## M. Deployment and rollback plan [P]

1. **Code deploy, flags unset.** Expected production change: none for identity. The 22 index-name declarations become no-ops. Verify:
   - boot logs no longer show the six "different name" warnings;
   - `tv_read_airings` still has 16 indexes;
   - no `content_*` collections;
   - crawl unchanged.
2. **Shadow in production** (separate approval). Measure the historic-slug index memory first. Then either set `CONTENT_IDENTITY_SHADOW=true` for the precompute job only, or run `node dist/scripts/content-identity.js shadow <date>` (read-only).
3. **Writes** (separate approval):
   - `CONTENT_ENTITIES_ENABLED=true` and `CONTENT_IDENTITY_WRITES=guiatv`;
   - start with `CONTENT_IDENTITY_MAX_CREATES` low;
   - `mongodump` of the 3 `content_*` collections daily during the ramp.
4. **Airing refs:** only after the §I sequence.

**Rollback:**
- Unset the variables and restart. Writes stop at the next rebuild.
- The `content_*` collections can stay or be dropped; nothing public reads them.
- Code: revert the merge, or repoint `/var/www/guiatv/current` to `20261021003516`.
- The index-name change needs no rollback because live indexes are not modified.

## N. Remaining risks and open decisions

1. **Unknown kinds (about 45%)** stay unresolved. Options: map more EPG categories, use TMDB TV genre or type, or accept. Kids, documentaries and "Otros" mix films, series and shows, so they aren't guessed.
2. **TMDB enrichment** applies non-matching last search results to airings (§A). Identity is protected, but posters and synopses can still be wrong today. Fixing it is a separate change.
3. **Historic-slug index memory** at production scale is unmeasured (§J).
4. **First-come base slug for remakes:** the first work to allocate gets the bare slug; legacy history isn't consulted for which remake "owns" it (2C §F.4 rule 4). Both remakes stay `noindex` candidates until review.
5. **`assistant_operational_events` TTL:** declared, never applied in production. Decide whether to enforce the 30-day retention (deletes older events) or remove the TTL declaration.
6. **Remaining 2D-2 production steps** each need explicit authorisation: shadow, writes, airing index build, refs.
7. **Review ownership:** the owner by default; name any editor allowed to approve or reject.
8. **Push and PR** not done. Pushing runs CI, including the new Mongo suite.

**STOP.** Nothing was pushed, merged, deployed, enabled, backfilled or indexed in production.
