# Phase 2D-2C: production shadow validation

2026-10-21, release `20261021103201` (merge `81610f2`, PR #34). This phase made one read-only shadow run against production. Nothing was committed, pushed, deployed, enabled, indexed or written.

Labels: **[V]** verified in this phase, **[E]** estimate, **[U]** unverified, with the reason.

## 1. Production baseline [V] (08:50 UTC, before the run)

| Check | Result |
|---|---|
| Release / commit | `/var/www/guiatv/current` → `releases/20261021103201`, `release.json` gitSha `81610f2…` |
| Database | `guiatv` (`MONGODB_DB_NAME`), MongoDB 8.0.19 standalone, WT cache 0.5 GB (0.39 GB used) |
| `CONTENT_*` flags | none in `/etc/guiatv/api.env`; none in the `guiatv-api` unit environment |
| Collections / indexes | 40 / 272 |
| `content_*` collections | none |
| `tv_read_airings` | 16 indexes, none on `program.entityId`; 0 airings with `program.entityId` or `program.canonicalPath` |
| Host | 6 vCPU, load 0.25–0.6; RAM 11.9 GB, 8.6 GB available; swap 4 GB, 0 used; disk 84 GB free (42% used) |
| Services | `guiatv-api` (PID 52655), `guiatv-ssr` (52834) and `mongod` (894) active, 0 restarts; `/health` 200 in 4 ms |
| Competing jobs | in-API cron: syncEPG `0 */6` and precompute `15 */6` (next 12:00/12:15 CEST, the run was at 10:52 CEST); the only backup cron (`auctorio-backup`, 03:10/03:40) is Postgres for another app; no Mongo backup job |

### Shadow CLI read-only proof [V]

Code review of the deployed `dist/scripts/content-identity.js shadow`:
- Every write in `ContentIdentityIngestion.run` (title-key insert, `ensureEntity`, `flagClaimConflict`, `allocateCanonicalPath`, airing refs, `touch`) is gated on `mode === 'write'`. The CLI hard-codes `createContentIdentityIngestion('shadow')`. In shadow mode, slug availability is read with `findByPaths`.
- The `content_*` models declare `autoCreate: false, autoIndex: false`, so reading a missing collection does not create it.
- **Residual risk found:** `TVReadAiring` and `Program` use mongoose defaults (`autoCreate`, `autoIndex` on). Compiling them in any process sends `createIndexes` for their schema indexes. These indexes already exist (the API boot runs `createIndexes()` with the same schemas), so this would be a no-op. Even so, the command is a DDL operation.
- The import chain touches MongoDB only. There is no Redis and no outbound HTTP.

To make read-only enforced rather than argued, the run used a process-local preload, `/tmp/guiatv-2d2c-guard.cjs`. It changes no file or configuration. The preload:
- sets `mongoose.set('autoIndex'|'autoCreate', false)`;
- forces `monitorCommands` and exits with code 97 on `commandStarted` for any write or DDL command (`insert`, `update`, `delete`, `findAndModify`, `create`, `createIndexes`, `drop*`, `collMod`, `renameCollection`, …) or for a `$out`/`$merge` pipeline, before the command is sent;
- tallies every command by name and collection.

Self-test against a throwaway local `mongod`: a read passed, a schema with an index created nothing, and an `insert` was killed before it reached the server (collection list still empty).

## 2. Command executed [V]

Target date `20261020`: the latest day that is fully materialised and final. It has 11,893 airings on 448 channels, its last airing ends 23:59 Madrid time, and it was last rebuilt 2026-10-20 22:16 UTC, after the day had ended. `20261021` (12,477 airings, 442 channels) is still "today" and will be rebuilt again. `20261022` is partial (407 channels) and `20261023` thinner still (289).

```sh
cd /var/www/guiatv/current/apps/backend
set -a; . /etc/guiatv/api.env; set +a
unset CONTENT_ENTITIES_ENABLED CONTENT_IDENTITY_SHADOW CONTENT_IDENTITY_WRITES CONTENT_IDENTITY_AIRING_REFS CONTENT_IDENTITY_MAX_CREATES
systemd-run --scope --quiet -p MemoryMax=1200M --nice=10 -- \
  /usr/bin/time -v timeout 600 node --max-old-space-size=1024 -r /tmp/guiatv-2d2c-guard.cjs \
  dist/scripts/content-identity.js shadow 20261020
```

The `unset` is a no-op safeguard, because none of these variables exist. A 0.5 s sampler ran alongside, recording load, API/mongod RSS, `MemAvailable` and established `:27017` connections.

## 3. Execution result [V]

Exit code **0**, 08:52:33–08:52:44 UTC. No warnings or exceptions. The only `WARN` was the expected "MongoDB disconnected" at shutdown.

## 4. Resource measurements [V]

| Metric | Value |
|---|---|
| Wall clock (process) | 9.15 s, of which `run()` took 6.70 s (`durationMs`) |
| CPU | 7.55 s user + 0.56 s sys, 88% of one core, under `nice 10` |
| Peak RSS | **174 MB** (178,620 kB), against a 1,200 MB scope cap. No swap, 1 major fault |
| Mongo commands | **197**, all reads: `find` on tv_read_airings 1, programs 1, media_catalog 2, tv_program_brands 1, content_title_keys 4, content_entities 3, content_slugs 2; `getMore` 182; `endSessions` 1 |
| Connections | `:27017` established went from 9 to a peak of 15 (driver min pool 5 + monitor) and back to 9. 25,588 still available |
| Host during run | load1 ≤ 0.50; `MemAvailable` minimum 8,602 MB (−127 MB) |
| API during run | RSS flat (274 MB); `/health` 200 in 3 ms after the run; same PID, 0 restarts |

The 182 `getMore`s are the cursors over 11,893 airings and the streamed legacy-title scan (150k brands, §O.4 of 2D-2). Production is in line with the local replay (2D-2 §J: 3.0 s write / 0.15–0.34 s shadow without the legacy scan). The CLI's per-process cost is dominated by the legacy scan and by node startup.

## 5. Identity quality metrics, production `20261020` [V unless noted]

| Metric | Value |
|---|---|
| Airings examined | 11,893 |
| Excluded: sport airings (with `sportFacet`) | 1,492 |
| Excluded: generic titles | 36 |
| Excluded: unkeyable titles | 41 |
| Unique candidates (`key\|kind\|tmdb\|year`) | 3,763 |
| Kinds | unknown 1,650 (**43.8%**), show 1,241, series 498, movie 374 |
| TMDB ids confirmed by catalogue | 910 |
| TMDB ids rejected (unconfirmed) | 169 (**15.7%** of the 1,079 TMDB-tagged candidates) |
| Decisions | unresolved 1,648 (`unknown_kind`), create 2,110, bind 3, review 2 |
| Existing title-key matches | 0 against stored rows (no `content_*` data exists). The 3 binds are same-day merges onto rows created earlier in the run |
| New entities simulated | 1,000 (`MAX_CREATES` default); **1,110 deferred** |
| Ambiguous | 2 (`several_entities`) |
| Manual review | 0 |
| Canonical paths allocated (of the 1,000 simulated) | 876; 699 (80%) to the verified historic owner of the URL |
| Paths refused (candidate paths) | `historic_unverified` 137, `historic_ambiguous` 10, `historic_conflict` 3, `unsupported_slug` 1 |
| Pathless entities | 124 of 1,000 (**12.4%**): `historic_unverified` 117, `historic_conflict` 3, `historic_ambiguous` 3, `unsupported_slug` 1 |
| Write counters | all 0; airing refs `skipped: shadow` |
| Estimated storage of simulated entities [E] | 1.5 MB (CLI estimate, 1,000 × 1.5 KB) |

**Not exposed by the CLI [U].** It produces aggregates only. These are not measured, and they are not zero:
- per-title lists;
- false-match rate among the 910 "confirmed" TMDB ids;
- the movie/series/show split of the 1,110 deferred creations;
- path outcomes for the deferred 1,110.

The `pathless` audit command reads stored entities, and there are none.

### Highest-impact quality problems

1. **Unknown kind, 43.8%.** It matches the local replay (~45%). The decision is open (2D-2 §N.1): map more categories, use the TMDB TV type, or accept.
2. **The cap hides half the day.** 2,110 creates were needed and only 1,000 were simulated, so path and pathless metrics describe a 47% sample. Its order is deterministic (key, then TMDB-backed, then dated first), so the sample is not random. [E] At the default cap, writes need about 3 days to absorb the backlog, plus new titles each day.
3. **12.4% pathless, against 9.3% locally.** This is almost entirely `historic_unverified`: title-only films with no year, and series/shows whose slug a TMDB TV work answers. It is intentional by design. These entities stay invisible until review or 2D-3.
4. **TMDB rejection, 15.7%.** These ids are protected from identity, but they confirm that the enrichment bug in 2D-2 §A affects posters and synopses in production today.
5. **No entity-level sample was inspected.** Precision of the 2,110 "creates" (duplicates across spellings, wrong kind) is unverified on production data.

## 6. Mutation checks

**Process-level [V].** Every command the shadow process sent went through the guard. All 197 were reads. No write or DDL command was issued; the guard would have exited with 97, and the process exited with 0. The guard intercepts in the driver, so the evidence is per process and not mixed with API traffic. Global `opcounters`/`top` deltas could not separate this run from the API's own writes: precompute updates `programs` and `tv_program_brands` continuously.

| Check | Before | After |
|---|---|---|
| API / SSR / mongod PID and restarts | 52655 / 52834 / 894, 0 | same, 0 [V] |
| Public routes, sitemap, SSR, canonical | not touched: the CLI has no HTTP surface, and no code or config changed | [V] by construction |
| Collections / indexes, `content_*`, airing `entityId` count | 40 / 272, none, 0 | **[U] not re-read** |

The post-run database snapshot was refused by the session's auto-mode classifier as a "production read". It was not worked around. To close it, the owner can run (read-only):

```sh
ssh contabo 'set -a; . /etc/guiatv/api.env; set +a; mongosh --quiet "$MONGODB_URI" /tmp/guiatv-2d2c-baseline.js'
```

Expect `collections: 40`, `indexes: 272`, `contentCollections: []`, `airingIndexes: 16`, `airingEntityIndex: []`, `airingsWithEntityId: 0`, `airingsWithCanonicalPath: 0`. The guard data already rules out a change from this process.

The run left these files in the server's `/tmp`: `guiatv-2d2c-guard.cjs`, `guiatv-2d2c-baseline.js`, `guiatv-2d2c-shadow.{out,err}` and `guiatv-2d2c-sampler.log`.

## 7. The transient 503s

There are two separate populations. Neither comes from nginx: every 503 body is the SSR's CSR fallback (4,262–4,304 bytes), and `error.log` has no upstream timeout or reset at the relevant times. The "connection refused" lines there are at 00:35 and 10:32 CEST, which are API restarts during deploys.

### 7a. The six crawl 503s: SSR render timeouts on a cold start [V]

- `access.log`, 10:38:21–22 CEST (08:38 UTC): `/plataformas`, `/canales`, `/programacion-tv/{peliculas,que-ver-hoy,en-directo,series}`, UA `guiatv-seo-crawl`.
- `guiatv-ssr` journal, same second: exactly **6 × `SSR render timeout`**, the 20 s `Promise.race` in `ssr-server.mjs:445`, which maps to `sendCsrFallback(503)` at line 505.
- `guiatv-api` at 08:38:20 UTC: a `MongoWaitQueueTimeoutError` ("Timed out while checking out a connection from connection pool", 5 s `waitQueueTimeoutMS`, `maxPoolSize` 30) on `/v2/discovery/browse`.
- Load was low: 214 requests in the 2 minutes around it.
- The same burst appears after every recent deploy: 9 at 15:05, 4 at 19:36 and 6 at 20:36 CEST on 10-20, and 6 at 10:38 on 10-21. Isolated timeouts appear about once an hour otherwise (37 in 24 h).
- `seo-crawl.mjs` runs 6 workers, and its first URLs are those same six hub pages.

**Likely cause:** right after a restart, the SSR cache, the API caches and the WiredTiger cache are cold. Six heavy hub renders run at once, each fanning out to several API aggregations, so Mongo pool checkouts queue and renders pass the 20 s budget. "Connection resets" is not supported by today's logs. **[U]** The exact per-render API fan-out and event-loop lag were not measured, because the SSR exposes no lag metric.

### 7b. Persistent bot 503s on legacy `/contenido/program:*` URLs [V], higher impact

- 306 of today's 319 503s, and about 1,200 yesterday, are bingbot or other bots requesting `/contenido/program:<legacy id>`.
- `redirectLegacyCatalog` (`ssr-server.mjs:374`) calls `/v2/catalog/<id>`. The API answers **500** "TV read item not found: …" (745 in 24 h) instead of 404/410. Any status other than 404/410 becomes a 503 with `Retry-After: 120`.
- Bots are told the page is temporarily down and keep retrying dead URLs. This is backlog issue #30. It is deterministic, not transient.

### Remediation proposal [P], not applied

1. **API:** map "TV read item not found" to 404, or 410 for past-dated ids, in the catalog controller. The SSR then returns 404 or 301 with no SSR change. This is the largest 503 source.
2. **Deploy:** warm the SSR after restart (sequentially GET the ~10 hub pages from loopback before the smoke check and crawl), and start the post-deploy crawl with 2 workers for the first minute.
3. **SSR:** a small render-concurrency gate, so excess requests wait instead of racing the 20 s timer. Also consider serving the last cached copy of a hub page on timeout (stale-on-error) instead of a 503.
4. **API pool:** check the slow `discovery/browse` and `channels` queries before raising `maxPoolSize`. A bigger pool on a 0.5 GB WiredTiger cache moves the queue into `mongod`.

## 8. Reviewer validation finding [V]

`ContentIdentityService.ts:45`:

```ts
!/^\S.{0,63}$/.test(String(reviewer || '')) || ['ingest', 'system', 'auto'].includes(reviewer)
```

The check is case- and whitespace-sensitive. `System`, `AUTO`, `system ` (trailing space) and `Ingest` all pass, and the raw value is stored as `review.by`. `review` (the CLI service's actor) is not reserved either. Exposure is low: the CLI only, with write flags required, run by someone with root on the server. Even so, it defeats the stated "named person, no automatic approval" policy.

Proposed fix (one function, plus storing the normalised name), **not deployed**:

```ts
const RESERVED_REVIEWERS = new Set(['ingest', 'system', 'auto', 'review', 'admin', 'root', 'bot', 'cron']);
/** Returns the normalised name to store; review decisions must name a real person. */
function assertReviewer(reviewer: string): string {
  const name = String(reviewer ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (!/^[\p{L}\p{N}][\p{L}\p{N} ._@-]{1,63}$/u.test(name) || RESERVED_REVIEWERS.has(name.toLowerCase())) {
    throw new ContentIdentityError('reviewer_required', "a review needs the reviewer's name");
  }
  return name;
}
```

`reviewTitleKey` and `rejectTitleKey` would pass the returned `name` on as `by`. Add one test covering `System`, `system `, `AUTO`, `''` and a valid `Manuel`. Optionally, add an allow-list of reviewer names in `api.env` (§N.7 ownership).

## 9. Remaining risks

- **[U]** No entity-level precision check on production data: TMDB false matches inside the 910 confirmed ids, duplicate entities across spellings, and kind errors.
- **[U]** Post-run collection, index and airing counts not re-read (§6).
- **[E]** The default cap of 1,000 per run needs about 3 days to absorb the first-day backlog. Path metrics for the deferred half are unknown.
- 43.8% unknown kind stays unresolved by design.
- 12.4% pathless (intentional) means those entities need review or 2D-3 work before they can be public.
- Reviewer normalisation (§8) is not fixed.
- The `assistant_operational_events` TTL decision (2D-2 §N.5) is still open.
- The legacy-catalogue 500→503 loop wastes crawl budget today (§7b), independent of identity.

## 10. GO / NO-GO

- **Shadow mode: GO [V].** It is safe, bounded and cheap on production data: 9 s, 174 MB RSS, 197 read commands, no load or API impact.
- **Write mode: NO-GO for now.** Execution and resources are not the blocker. Three things are:
  1. no production entity sample has been reviewed, so TMDB false-match risk and duplicate risk are unmeasured;
  2. reviewer normalisation is unfixed;
  3. the post-run counts are not confirmed.

  These are small and specific, and none needs a design change.

## 11. Next phase (each step needs separate authorisation)

**2D-2D: shadow sample review, then a write canary.**

1. Close §6: the owner runs the baseline script once (read-only).
2. Code, as a PR:
   - the `assertReviewer` fix (§8);
   - an opt-in `shadow <date> --sample N` that prints, per decision class, N titles with kind, TMDB id and planned path. It is read-only and adds no new reads.
3. One read-only shadow of `20261021` with `--sample 50` and `CONTENT_IDENTITY_MAX_CREATES=3000`, so the whole day is simulated. The owner reviews about 100 creates (precision target ≥ 98% correct kind and identity) and every TMDB-confirmed movie in the sample.
4. **Write canary**, only after step 3 passes:
   - `mongodump` of the database first, and confirm a restore of one collection to a scratch `mongod`;
   - for **one** precompute cycle, set `CONTENT_ENTITIES_ENABLED=true`, `CONTENT_IDENTITY_WRITES=guiatv` and `CONTENT_IDENTITY_MAX_CREATES=200`, with **no** `AIRING_REFS` and no index build;
   - verify `content_*` counts equal the report's `writes.*`, the `pathless` audit, the review `queue`, an unchanged crawl and 0 API errors.
   - **Rollback criteria** (any one): `failed` > 0, any `duplicateKeyConflicts` or `claimConflicts`, a precompute duration change over 10%, API p95 or 5xx movement, or a sampled entity precision under 98%. Rollback is to unset the variables and restart. Dropping the 3 `content_*` collections is optional, since nothing public reads them.
5. Separately, and in parallel: fix §7b (API 404/410 for missing TV read items) and add the post-deploy SSR warm-up (§7a).
