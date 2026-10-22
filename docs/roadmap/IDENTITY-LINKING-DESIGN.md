# Identity linking (airing → catalogue row): design for the next milestone

Status: **design only** (M02-C). Nothing here is implemented or authorised. Volatile numbers come from `artifacts/m02-c/measure-postdeploy-20261022.json` (2026-10-22, before any post-fix EPG sync).

## Problem
`program.mediaId` (the catalogue row id on an airing) is what `selectWorkBroadcasts({requireCatalogueRow:true})` and `legacyBindingRefusals` need. Only 26.3 % of airings that carry a TMDB id have it.

## Why it is missing (code + data)
`SyncEPGData.enrichProgramsWithTMDB` has two paths. **api_primary** (TMDB search + `titleMatches`) calls `recordCatalogMatch` and gets a `mediaId`. **db_cache** (`dbHit`, phase 1 and 2) copies tmdbId/image/year from the stored `programs` row and, until the 3F fix, never the `mediaId`. 13 074 of 16 835 stored programmes with a TMDB id have no `mediaId`, and cached hits skip TMDB, so the gap is self-perpetuating. The 3F fix only copies a `mediaId` that already exists on the stored row: projected at most 417 of 2 746 unlinked airings (→ ≈ 37.5 %).

Note: the programme's `tmdbId` itself came from a search plus a fuzzy `titleMatches`. A derived link therefore certifies *consistency with the catalogue*, not new proof that the broadcast is that film. It is a weaker evidence tier than a sync-time link.

## Candidate pool (strict rules applied to the 2 746 unlinked airings)
Rules: catalogue row valid (non-empty title/normalizedTitle); same TMDB id; type = expected type (Cine→movie, Series→tv; other categories need a single row across types); exactly one eligible row; airing title key ∈ {row title key, original title key}; TMDB id not shared by other title keys in the window; an existing `mediaId` is never touched.

| Outcome | Airings | Distinct (tmdbId, title key) |
|---|---|---|
| **linkable** | 2 150 | 655 |
| title key differs | 290 | 106 |
| TMDB id shared by other titles | 63 | 10 |
| no row of the expected type (mostly series whose TMDB id only has a movie row) | 221 | 9 |
| several rows, same type | 6 | 1 |
| only invalid rows | 12 | 5 |
| airing title has no key | 4 | 1 |

(The earlier "2 196" figure did not apply the type, conflict and validity rules; 2 150 is the figure under the mandatory rules.)

## Placement
| | A. at sync | B. at read-model build | C. hybrid |
|---|---|---|---|
| Correctness | best provenance (same moment as the TMDB match) but the cache path has no TMDB result to link from, so it needs the same resolver anyway | one resolver over `program.tmdbId` + title, identical rules for every path | resolver shared; persisted on programmes too |
| Latency | +1 batched `media_catalog` read per sync | +1 batched read per build; sync unchanged | both |
| Persistence / reprocessing | writes `programs` (source of record); existing rows relink only when resynced or by a backfill | writes only `tv_read_airings` (derived, rebuilt every sync); full reprocess = next build | both |
| Cache | stored row keeps the link, cache stays consistent | stored programmes stay unlinked; every build recomputes | stored link + recompute |
| Operational complexity | schema/provenance on programmes, backfill script | none beyond the builder | highest |
| Observability | counters in sync | counters in builder (`/v2/health/metrics`) | two places |
| Rollback | undoing needs a keyed unlink on source data | drop the flag, rebuild; no source data touched | partial |
| DB impact | writes to `programs` | none new (rows are rewritten each build anyway) | both |

**Recommendation: B**, as a pure function (`linkCatalogueRow(program, candidateRows) → {mediaId, evidence} | {blocked: reason}`) called by `TvReadModelBuilder` with one batched catalogue prefetch per build. It touches only derived data (rollback = flag off + next build), cannot overwrite an existing `mediaId` (builder keeps `program.mediaId` first), and reuses the writes the builder already performs. A (writing `programs`) is a possible later step once B has proven the rules.

## Required properties
- Evidence on the airing: `program.mediaLink = { rule: 'tmdb-type-titlekey-unique', version: 1, tmdbType, titleKey }`; its absence means a sync-time link. Idempotent: same inputs → same output; never replaces an existing `mediaId`; a conflict (shared TMDB id, several rows, type mismatch, invalid row) blocks and is counted by reason.
- The joiner must be told the tier. **Owner decision needed before activation**: whether a derived link satisfies `requireCatalogueRow` for legacy enrichment (default: no — report both tiers; only sync-time links count until the owner approves). Title similarity is never evidence.
- Flag default off (repo convention); shadow mode first: compute and count, persist nothing.

## Projection (assumptions, not a promise)
Under the 2026-10-22 snapshot, if every linkable airing were accepted: (979 + 2 150) / 3 725 = **84.0 %** (ceiling). Floor if the owner accepts only sync-time links plus the 3F copy path: ≈ 37.5 %. Assumes: same EPG composition, the invalid catalogue rows (55) unchanged, no new conflicts, and that the 2 150 hold after the next sync (re-measure first; the 3F effect is separate and overlaps part of them).

## Smallest next milestone (M03-L1, shadow mode)
Implement `linkCatalogueRow` + unit tests (every blocked reason, idempotence, no overwrite, type, conflict) and a Mongo test for the builder; wire into `TvReadModelBuilder` behind `EPG_CATALOGUE_LINK_MODE` = `off` (default) | `shadow`; `shadow` only increments counters. Acceptance: backend tests green; in shadow mode on production, counters match `scripts/m02b-measure.cjs` `linkability` within 1 %; no write beyond what the builder already does; latency of a build unchanged within 10 %; flag off by default. Persisting links (`persist` mode) is a separate, separately authorised step.
