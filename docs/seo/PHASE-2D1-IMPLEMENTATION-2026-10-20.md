# Phase 2D-1: persistent content identity foundation

Branch `feat/persistent-content-foundation-2d1`, based on `origin/main` at `fcabbaa`. Local only: not pushed, not merged, not deployed.

**Schema deployment and data backfill are separate steps.** This branch is the schema step only. Deployed with the flag off, it changes nothing in production: no collection, no index, no read and no write. Populating entities is 2D-2 (ingestion) and 2D-3 (backfill). Neither is part of this branch.

## Baseline

- PR #25 is merged as `5c97b01`. `origin/main` is `fcabbaa`, PR #31: the 2D-0B report and three traffic JSON files, docs only (`git diff --stat 5c97b01 fcabbaa`).
- **Production is on release `20261020232611`** (`gitSha` `fcabbaa`, deployed 21:26 UTC), not `20261020210703`. The PR #31 docs merge triggered `deploy.yml`, and the application code is identical to `5c97b01`.
- The untracked `PHASE-1-AUDIT`, `PHASE-2C-ARCHITECTURE` and `phase-2c/` files were carried over unchanged. They are not committed.
- Skills: no MongoDB or TypeScript skill is installed. From the project skills I applied the following:
  - `mk-site-architecture`: existing URLs are preserved and become redirects, never reassigned.
  - `mk-programmatic-seo`: generic slots are never entities, and entities default to `noindex`.
  - `seo-technical`: redirects are single-hop and canonicals are self-referencing.

  No subagents and no new dependencies were used.

## A. Architecture implemented

| Layer | File | Role |
|---|---|---|
| Domain (pure) | `apps/backend/src/domain/services/contentIdentity.ts` | Kinds, statuses, lifecycle table, ULID entity ids, path normalisation, reserved slugs, title identity key, matching decision |
| Contracts | `domain/repositories/IContentIdentityRepository.ts` | Entity, slug and title-key repositories |
| Models | `infrastructure/database/models/Content{Entity,Slug,TitleKey}.model.ts` | Strict schemas, `autoIndex: false`, `autoCreate: false` |
| Adapters | `infrastructure/repositories/MongoContentIdentityRepositories.ts` | Insert-only writes, duplicate-key recovery, write-readiness guard |
| Service | `application/services/ContentIdentityService.ts` | Create and allocate, repair, redirects, path resolution, lifecycle and merge, title matching and review |
| Flag | `shared/config/contentEntities.ts` | `CONTENT_ENTITIES_ENABLED`, off by default |
| Existing | `TVReadAiring.model.ts`, `initializeMongoCollections.ts` | Optional entity references; boot creates the new collections only when the flag is on |
| CI | `.github/workflows/performance.yml` | `mongo:8.0` service (standalone, like production) and `TEST_MONGO_URI`, so the integrity tests run in CI and are not skipped |

Not built, by design: no HTTP endpoint, no container registration, no ingestion hook, no slug generator (`slugifyEntityTitle`, 2D-2), and no `content_availability` (it waits for the TMDB/JustWatch decision, 2C §P.8).

## B. Models and schemas

All three schemas use `strict: 'throw'`, so an unknown field is an error.

**`content_entities`**
- `entityId`: `ce_` plus a 26-character ULID, `immutable`.
- `kind`: one of show, series, movie, event, unknown.
- `status`: one of candidate, active, merged, removed. The default is candidate.
- `mergedInto`: required exactly when `status` is `merged`.
- Titles: `title`, `originalTitle`, and a non-empty `normalizedTitle`.
- `year`, and `externalIds.tmdb {type, id}` where the id must be an integer.
- `canonicalPath`: must already be in normalised form.
- `metadata.{synopsis,genres,images}`: each holds `{value, source, updatedAt}`, where source is manual, tmdb, epg or backfill.
- `matching {method, confidence 0..1, decidedAt, decidedBy}`.
- `indexability {state, reasons, evaluatedAt}`: defaults to `noindex` with reason `not_evaluated`.
- `lifecycle {changedAt, changedBy, reason}`, `contentChangedAt`, `version`, and timestamps.

**`content_slugs`**
- `_id`: the full normalised path.
- `entityId`, `role` (canonical, redirect or gone), `reason`, `createdBy`, and timestamps.
- `history[]`: an audit trail with `create`, `role_change` and `reassign` entries (who, when, from/to role or entity, note).

**`content_title_keys`**
- `_id`: `key|kind|discriminator`.
- `key`, `kind`, `discriminator` (`*`, `tmdb:<movie|tv>:<id>` or `year:<yyyy>`), `year`.
- `entityId`: required for `verified` and `candidate` rows, forbidden for `ambiguous` and `manual_review` rows.
- `method`, `confidence`, `candidates[]`, `reason`, `firstSeenAt`, `lastSeenAt`, `decidedBy`, and `review {by, at, note}`.

**`tv_read_airings`**
- `program` stays `Mixed`. Converting it to a typed subdocument would strip unknown fields under strict mode.
- Added a validator: `program.entityId` must be a valid entity id when present; `program.canonicalPath` must be a normalised path and is allowed only alongside `entityId`. Both may be absent.
- Every existing row still validates. Validation costs about 1 ms per 20k-row day.
- Nothing writes these fields yet. No index was removed or changed.

## C. Index definitions

| Collection | Name | Key | Options |
|---|---|---|---|
| content_entities | `uniq_entity_id` | `entityId` | unique |
| | `uniq_entity_tmdb_live` | `externalIds.tmdb.type, .id` | unique, partial: `tmdb.id` is a number and `status` is `$in` [candidate, active] |
| | `idx_entity_title_kind` | `normalizedTitle, kind` | not unique (§E.3) |
| | `idx_entity_indexability` | `indexability.state, kind, entityId` | sitemap paging |
| content_slugs | `_id` | path | unique by construction |
| | `idx_slug_entity_role` | `entityId, role` | |
| | `uniq_slug_canonical_per_entity` | `entityId` | unique, partial: `role: 'canonical'` |
| content_title_keys | `idx_titlekey_key_kind` | `key, kind` | |
| | `idx_titlekey_entity` | `entityId` | partial: `entityId` is a string |
| | `idx_titlekey_review` | `state, lastSeenAt` | partial: `state $in` [ambiguous, manual_review] |
| tv_read_airings | `idx_tvread_entity_start` | `program.entityId, airing.start` | partial `{ 'program.entityId': { $exists: true } }`; **defined, not created** |

- **Production Mongo is 8.0.19 with FCV 8.0**, so `$in` in partial filters is supported. The integration test checks the stored filter.
- **Correction to the 2C proposal:** a `$type: 'string'` partial filter on the airing index is never used. On MongoDB 8.0, `find({'program.entityId': X})` ran as a COLLSCAN with that filter. With `$exists: true` the planner picks the index, and the test asserts this from `explain`.
- **Why the airing index isn't on the schema:** at boot `ensureMongoCollectionsAndIndexes` calls `syncIndexes()` on every model, and mongoose `autoIndex` (on for existing models) calls `createIndexes` on first use. Registering the index would build it during API startup on the 786k-row collection. `syncIndexes()` also drops any index the schema doesn't declare, so an index built by hand without the schema change would disappear at the next restart. It is therefore exported as `TV_READ_AIRING_ENTITY_INDEX`, and a test asserts that it is not on the schema.
- **Order for 2D-2:**
  1. Build the index off-peak with `db.tv_read_airings.createIndex({ 'program.entityId': 1, 'airing.start': 1 }, { name: 'idx_tvread_entity_start', partialFilterExpression: { 'program.entityId': { $exists: true } } })`.
  2. In the same release window, deploy the commit that registers the spec on the schema. Boot then finds the index already present and does nothing.

**Airing index creation cost** (inference from the production stats in §G; not measured):
- **Size:** 0 MB at creation, because no row has an `entityId`. With every airing linked it would be about 50–60 MB. The basis is `idx_tvread_brand_date_start`, which is 53.5 MB for 785,786 keys of similar width (brand key + date + start, compared with 29-character id + start).
- **Build:** one collection scan of 785,786 documents: 2.9 GB uncompressed, 566 MB on disk, through a 0.54 GB WiredTiger cache. Existing indexes already total 630 MB, so the scan evicts the hot working set and the next minutes of reads come from disk. The key sort fits easily in the 200 MB `maxIndexBuildMemoryUsageMegabytes`. Since 4.2, builds take exclusive locks only briefly at start and end.
- **Recommendation:** build at low traffic (04:00 Madrid) after a `mongodump` of `tv_read_airings`, and watch `db.currentOp({ 'command.createIndexes': { $exists: true } })`. Duration on the VPS is unmeasured; time it on that run.
- The three new collections are empty, so creating their indexes costs nothing.

## D. Identity collision policy

**Data reality (production, 90 days):** 213 brand keys carry more than one TMDB id, and 310 TMDB ids appear under more than one brand key. A bare `brandKey` therefore can't be a unique identity, so this branch departs from 2C §D.3, which proposed `_id = brandKey`. A title-key row is `key|kind|discriminator`, and one key can have many rows.

- **key** = `titleIdentityKey(title)`:
  - Built from the existing `buildProgramBrandKey`, unchanged so stored brand keys stay reusable, minus a trailing "capítulo/episodio N" marker.
  - Accents fold: "Espejo Público" and "Espejo Publico" give the same key.
  - `T1 E929` markers are stripped, so "La Promesa T1 E929" becomes `la_promesa`.
  - A named episode ("Friends: El de la boda") keeps its own key and is never collapsed into the series.
  - Non-Latin titles produce no key. "捕风追影2" would otherwise become `2`, and media_catalog already holds 27 TMDB ids with an empty normalised title.
- **discriminator**:
  - Uses the most specific reliable context: TMDB work first, then release year, otherwise `*`.
  - EPG source ids were considered and not used, because `sourceProgrammeId` identifies an airing, not a work.
- **Generic titles** are rejected before matching: the existing `isGenericMovieTitle` plus the §F.5 list. Production evidence: `deportes` carries 2 TMDB ids today.

**Decision table (`decideTitleMatch`)**, a pure function that never mutates a stored row:

| Situation | Result |
|---|---|
| Exact row exists and is bound | `matched`: sticky |
| Exact row exists and is `ambiguous` or `manual_review` | `held`: stays unbound until reviewed |
| TMDB id, no live owner | `create`: `verified` if method is manual or confidence ≥ 0.95, otherwise `candidate` |
| TMDB id owned by an entity of the same kind (alias, e.g. "C.S.I. Miami") | `bind` to the owner |
| TMDB id owned by an entity of another kind | `review`, `manual_review`, reason `kind_conflict` |
| No TMDB id, no bound row of the same kind and compatible year (±1) | `create` a candidate, confidence ≤ 0.8 |
| Exactly one such entity | `bind` as `candidate` (≤ 0.8, method `title_kind` or `title_year`) |
| Several entities | `review`, `ambiguous`, with candidate list, no entity |

- **A verified mapping can't be overwritten.** Rows are insert-only, a duplicate insert returns the stored row, and the only method that changes a row's entity is `review`, a manual action recorded with reviewer and note.
- **Film versus series and remakes:** kind is part of the row id, and distinct TMDB ids are distinct rows and entities. The TMDB partial unique index stops two live entities sharing one TMDB id.

## E. Repository contracts

`IContentIdentityRepository.ts`:

- **Entities:** `insert` (returns `tmdb_taken` with the existing owner, or `id_taken`), `findById`, `findLiveByTmdb`, `findByNormalizedTitle`, `setCanonicalPath` (set once, never overwritten), `transition` (optimistic on `status` + `version`), `repointMergedInto`, `findWithoutCanonicalPath`.
- **Slugs:** `findByPath`, `findCanonical`, `listByEntity`, `insert` (returns `path_taken` or `entity_has_canonical`; never overwrites), `changeRole` (same entity only, audited), `reassign` (manual, non-canonical paths only, audited).
- **Title keys:** `listByKey`, `insert` (insert-only), `review`, `listReviewQueue`, `countByState`. The last two are the ambiguity reporting.

Domain code imports no Mongoose. The service depends only on the interfaces. `createContentIdentityService()` returns `null` while the flag is off.

## F. Concurrency and transaction strategy

Production Mongo is a **standalone server**: `hello().setName` is null, so multi-document transactions aren't available. The design doesn't need them. Each operation is an ordered sequence of single-document writes, each guarded by a unique index or a conditional filter. The slug registry is the source of truth, and `entity.canonicalPath` is a cache repaired from it.

| Operation | Steps | Crash after step… | Recovery |
|---|---|---|---|
| Create entity | 1. insert entity (`candidate`, no path) 2. insert canonical slug 3. set `entity.canonicalPath` | 1: pathless candidate, not resolvable | `findIncomplete()` → `allocateCanonicalPath()` with the same candidates |
| | | 2: slug exists, cache empty | the same call finds the slug and syncs the cache; the registry wins |
| Merge B into A | 1. B `merged`, `mergedInto` A 2. demote B's canonical to redirect 3. repoint entities merged into B | 1: resolution already correct (it checks status first) | call the same merge again; it resumes from the remaining steps |
| | | 2: chains of length 2 report `integrity_error`, never a wrong page | as above |

- **Concurrent creators of one TMDB work:** the partial unique index admits one winner, and every other caller receives the winner's entity and path. Tested with 12 in parallel.
- **Concurrent allocation of one path:** `_id` uniqueness. The loser moves to its next candidate and never takes the path.
- **Concurrent allocation for one entity:** the partial unique canonical index. The loser reads back the winner's path.
- **Lifecycle races:** the `version` filter means exactly one wins.
- **Duplicate-key handling:** every `E11000` is mapped by `keyPattern` to a typed conflict with the existing record.
- **Missing indexes:** writes call `diffIndexes()` once per model and refuse to run until every declared index exists (`ContentIdentityNotReadyError`). Without this, Mongo would create a missing collection implicitly on the first insert, with no unique indexes. Reads need no guard, because a missing collection reads as empty.
- **Redirects:**
  - A redirect stores the entity, never a target path.
  - The resolver answers with the target entity's current canonical, following `mergedInto` at most once.
  - Merges collapse chains, so a redirect is one hop by construction.
  - A redirect can only point at an `active` entity with a canonical, and never at its own canonical path (`would_loop`).
  - `removed` resolves to `gone` (410) and keeps its slugs; `merged` is terminal.

## G. Data-volume evidence and estimates

Read-only aggregation on production, 2026-10-20 21:31 UTC. Script: `phase-2d1/identity-volume.mongosh.js`, which uses find, aggregate and stats only. Output: `phase-2d1/identity-volume-production.json`, which contains aggregates plus at most 10 public programme titles per list, with no user data or credentials. A later local file read was blocked by the auto-mode "production reads" rule. That did not affect this query, and nothing was retried around the block.

| Measure | Value |
|---|---|
| `tv_read_airings` | 785,786 docs, 2.9 GB data / 566 MB on disk, indexes 630 MB; dates 2026-03-19 → 2026-10-22 (82 dates, avg 9,583/date, max 20,368) |
| `tv_program_brands` | 150,797 (11,708 with TMDB id); `media_catalog` 17,172; `programs` 206,532 |
| Airings, last 90 days | 548,404; generic or suppressed 1,069 airings, 70 titles |
| Distinct brand keys, 90 days | **76,008**: 14,188 sport, 6,654 with a TMDB id; 32,324 aired once |
| Brand key with more than one TMDB id | **213** (e.g. `la_promesa`, `focus`, `dog_house` with 3) |
| TMDB id under more than one brand key | 310 (aliases such as `csi_miami` / `c_s_i_miami`) |
| Legacy slug shared by different brand keys | 13 (e.g. `no` for "No" and "Noé") |
| Brand keys with more than one legacy URL spelling | 2,950 (accent or punctuation variants, all registry redirects in 2D-3) |
| Brand keys with both series and film categories | 228 |
| media_catalog: same title and kind, several TMDB ids | 304 (remakes); same title as film and series: 226 |
| Server | MongoDB 8.0.19 standalone, FCV 8.0, WT cache 0.54 GB, index build memory 200 MB, disk 85 GB free, RAM 12 GB |

Estimates:
- **Entities:** the 2C estimate of 15–40k is low. The upper bound is about 62k non-sport keys in 90 days, and the quality gate will cut that, since 32k keys aired once.
- **Storage of the new collections**, at 62k entities: entities ≈ 90 MB uncompressed (≈ 25 MB on disk), slugs ≤ 45 MB, title keys ≈ 25 MB, their indexes ≈ 20 MB. Under 1% of the 85 GB free disk.
- **The memory constraint is cache, not disk.** Indexes already exceed the WiredTiger cache, so any new hot index competes for 0.54 GB. Revisit `cacheSizeGB`: 12 GB RAM, 9 GB available.

## H. Feature flags

`CONTENT_ENTITIES_ENABLED`. Only `1`, `true`, `yes` or `on`, case-insensitive, turn it on; anything else, including unset, leaves it off.

| | Flag off (default) | Flag on |
|---|---|---|
| Boot | identical resource list to `main`; `content_*` never created | creates the 3 empty collections and their indexes |
| Runtime | `createContentIdentityService()` returns `null`; nothing imports the service | the same: no caller exists yet |
| Catalogue, sitemap, URLs, ingestion | unchanged | unchanged |

Booting the built API against a scratch database confirmed this. Flag off: 40 collections, no `content_*`. Flag on: 43. In both, `tv_read_airings` had 16 indexes and no entity index, and `/health` returned 200.

**Rollback** of the flag is to unset it and restart. Empty collections can stay, or be dropped with `db.content_entities.drop()` and the same for the other two; no other code reads them.

## I. Tests and results

| Check | Result |
|---|---|
| New pure tests (`contentIdentity.test.ts`) | 12 pass |
| New schema and flag tests (no DB) | 5 pass |
| New Mongo integration tests (ephemeral standalone `mongod` 8.0.29, throwaway db) | 17 subtests pass, 6 consecutive runs |
| Backend `npm test`, no DB (as CI ran it before this branch) | 382 pass, 0 fail, 2 skip (Redis, Mongo) |
| Backend with `TEST_MONGO_URI` | 400 pass, 0 fail, 1 skip (Redis). One run had a timing failure in `SyncEPGData.icon-cache-deferred` (untouched code, bounded-concurrency timer under parallel load); it passes alone and on rerun |
| `lint:backend` (`tsc`) | pass |
| `test:deploy` | pass |
| API boot smoke, flag off and on | pass (§H) |

Integration coverage:
- Entity id immutability, slug uniqueness, never-reassign, and exactly one canonical under concurrent allocation.
- Concurrent creation (same TMDB work; different works competing for one path).
- Duplicate-key recovery, and both partial-write recoveries.
- Redirect rules and loop rejection; merge with chain collapse; terminal merged state; soft removal and restore; optimistic lifecycle.
- Title keys: sticky, concurrent insert, verified not overwritten. Ambiguity queue and manual review. Audited role change and reassignment.
- Flag-off boot; missing-collection behaviour (reads empty, writes refused, no implicit creation).
- The existing ingestion shape still inserts; the airing index is partial, starts empty and is chosen by the planner.

**Not run locally, and why:**
- **Frontend Karma, SSR build and `seo:ssr-resilience`:** the branch changes no file under `apps/frontend`, `scripts`, `e2e` or `infra` (empty `git diff`), and WSL had about 1.1 GB free, below what `ng build --ssr` needs. `main` at `fcabbaa`, the same frontend bytes, passed CI and deploy. On a PR these run in CI (`performance.yml`, `seo-regression.yml`).
- **`seo:crawl` and the canonical matrix against a candidate:** they need the candidate API with production data. The flag-off candidate changes no request path, so a crawl would exercise production's code. Not run.

## J. Production compatibility

- The only runtime change with the flag off is the airing `program` validator. It passes every existing row shape, has no effect on reads, and costs about 1 ms per day of ingest.
- The three new model files are imported at boot but are inert (`autoIndex`/`autoCreate` off).
- No route, controller, catalogue, sitemap, SSR or frontend file changed. No existing index was removed or renamed.
- CI gains a `mongo:8.0` service container. The deploy workflow is unchanged.

## K. Remaining decisions

1. **Composite title keys** replace 2C §D.3's bare `brandKey` id (§D). Confirm.
2. **"Cine de barrio"** (107 airings in 90 days) is treated as generic by the existing `isGenericMovieTitle` (`cine` + ≤ 4 words), so it can never become an entity. The same rule covers other real shows (`cine western`, `historia de nuestro cine`). Exempt named shows, or accept?
3. **Title-only bindings:** a title without TMDB id or year binds to the single same-kind entity as `candidate` (confidence 0.8), rather than going to review. Accept, or send all of these to review?
4. **Year tolerance** ±1 (2C §E.2) can bind adjacent-year remakes; distinct TMDB ids still separate them.
5. **Airing index build window** (§C) and **WiredTiger cache size** (§G).
6. **Review queue ownership** (2C §P.10). Production will have at least the 213 multi-TMDB brand keys to review.
7. `content_availability` stays blocked on the TMDB/JustWatch terms (2C §P.8).
8. **Push and PR:** not done. Pushing would run the new CI Mongo service.

## L. Deployment readiness and rollback plan

**Ready for review, not for enabling.**

**Schema deployment** (this branch): merge, `deploy.yml`, flag stays unset. Expected result in production: nothing.

Verify:
- `db.getCollectionNames().filter(n => n.startsWith('content_'))` is empty.
- `db.tv_read_airings.getIndexes().length` is unchanged (16).
- `/health` is 200, and `seo:crawl` is unchanged.

**Optional: enabling the flag** (still no data). Set `CONTENT_ENTITIES_ENABLED=true` in `/etc/guiatv/api.env` and `systemctl restart guiatv-api`. Three empty collections and their indexes appear. Nothing reads or writes them.

**Data backfill** (later, not this branch): 2D-2 builds the airing index (§C order) and writes entities during ingestion. 2D-3 runs the backfill after a `mongodump` and a reviewed dry run.

**Rollback:**
- Revert the merge commit and `deploy.yml` redeploys, or repoint `/var/www/guiatv/current` to `20261020232611` and restart `guiatv-api` and `guiatv-ssr`.
- With the flag off there is no data to undo. With it on, the empty `content_*` collections can stay or be dropped.

**STOP.** Waiting for review. Nothing was populated, migrated, indexed in production, enabled, pushed, merged or deployed.
