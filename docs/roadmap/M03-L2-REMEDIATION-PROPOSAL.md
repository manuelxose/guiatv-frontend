# M03-L2 — remediation proposal for stored cross-type programme links (NOT executed)

Status: **proposal only.** No production write was made in M03-L2. Executing this needs a separate owner approval.

## What is wrong

Before M03-L2, the sync's DB-enrichment cache ignored content kind. A `Serie` programme reused a same-titled film's `tmdbId` and, from 3F on, its **movie** catalogue row id. The 2026-10-22 13:44Z census (`artifacts/m03-l2/cross-type-before.json`) found:

- **201 stored `programs` documents** carrying such a link: `trustFlags.tmdbKind` = `series`, `tmdbSource` = `db_cache`, `mediaId` → a movie row.
- 127 more `db_cache` documents carry a `mediaId` but no recorded kind. They are not known to be wrong.
- Read models built after release 20261022161030 drop these ids (`guardExistingMediaIds`). The stored documents keep them, because `saveBatch` never unsets `mediaId`.
- The stored `tmdbId` on those documents is the film's TMDB id, so it is wrong too.

## Why it is (mostly) self-limiting

Programme documents are per airing. Past airings expire through `cleanOldPrograms`. The sync no longer creates new bad links. When a future-day document is re-synced and the TV search finds a match, the stored `tmdbId` and `mediaId` are overwritten. When it finds none, the bad values stay stored, but the guard keeps them out of every read model. So the residue only touches consumers that read `programs` directly. One known example is `findEnrichedByTitles`, which now refuses these entries (`cross_type_media_id`).

## Proposed correction (if the owner wants the residue gone before it expires)

1. Dry run (read-only, under `readOnlyGuard`): list the `programs` documents where `trustFlags.tmdbKind` names one kind and `mediaId` points at a `media_catalog` row of the other kind. Output counts and ids to a file, with no titles.
2. Snapshot: `mongoexport` of exactly those documents (`id`, `tmdbId`, `mediaId`, `trustFlags`) to `/var/backups/guiatv/m03l2-<ts>.json`.
3. Write, in one bounded `updateMany` keyed on the exported `id` list: `$unset: { mediaId: 1, tmdbId: 1 }` and `$set: { 'trustFlags.tmdbMatched': false }`. Nothing else changes. The next scheduled sync re-enriches these documents through the type-safe path.
4. Verify: re-run `scripts/m03l2-cross-type.cjs`. The expected result is `storedProgrammes.kindMismatchesRow = 0`.
5. Rollback: `mongoimport --mode=merge` from the snapshot.

Not proposed: touching `media_catalog`, `tv_read_airings` (rebuilt every 6 h), content entities, or the 127 untyped documents.
