# Phase 3B — publication quality criteria (v1, 2026-10-21)

Identity verification answers *"is this the right work?"*. These criteria answer *"is this page worth showing, and worth indexing?"*. They are separate on purpose: a verified entity can still fail every criterion below, and passing them never verifies an identity. The code is `PublicationQuality.ts` (`assessPublicationQuality`); thresholds live in `QUALITY_THRESHOLDS`. Change a threshold here first.

**Fail-closed.** A criterion is `pass` only on positive evidence. Missing data is `unknown`, which blocks the tier that needs it. No metadata is invented or inferred from a title; a field the catalogue does not hold counts as missing.

## Tiers

| Tier | Meaning | Needs |
|---|---|---|
| `blocked` | not even a canary page | any of: identity not verified, title not a work, duplicate entity, canonical audit failing; or a canary tier not reached |
| `canary` | may be shown **noindex** to the allowlist | identity verified, title accurate, canonical clean, no duplicate entity, SSR reliable |
| `index_candidate` | content fit for indexing | **every** criterion below passes (Phase 3D added 14 and 15; no threshold of 1–13 changed). Indexing still needs an explicit owner decision; 3B never sets `indexability.state = index` |

## Criteria

| # | Id | Pass condition (objective) | Why |
|---|---|---|---|
| 1 | `identity_verified` | entity `active`, `matching.method = manual`, named matching and lifecycle reviewers (the 3A public-read rule) | a page for the wrong work is the worst outcome |
| 2 | `title_accurate` | `parseEpgTitle` reads the title as a work: no episode/slot wording, not a generic slot (`Cine`, `Noticias`…) | episode titles and slots are not entities |
| 3 | `year_reliable` | a year exists **and** its provenance is `independent` (the feed's own year, preserved by `EPG_YEAR_PROVENANCE`, agrees with the catalogue). A film without a year **fails**. A year that is TMDB's own is `unknown`, never `pass` | `SyncEPGData` overwrites the feed year with TMDB's: the stored year is the same source as the match, so it cannot confirm it (2D-2G) |
| 4 | `description_reliable` | synopsis ≥ 300 characters **and** a recorded source (`manual`, `tmdb`, `epg`) | thin text is the first Google "unhelpful content" signal |
| 5 | `no_duplicate_of_epg` | the synopsis repeats < 90 % of the current EPG description's distinct words | a copy of the listing adds nothing |
| 6 | `no_duplicate_entity` | no other entity with the same normalised title and year | two indexable pages for one work compete |
| 7 | `legacy_consolidated` | no legacy page for the work, or the legacy page 301s to the entity page | otherwise two live pages serve one work |
| 8 | `metadata_complete` | films: title, year, genres, synopsis, runtime. Series/shows: title, genres, synopsis | a visitor needs more than a title |
| 9 | `internal_links_ready` | ≥ 3 internal links from indexable pages | an orphan page is rarely crawled and signals low value |
| 10 | `canonical_consistent` | the canonical audit (`canonical-audit`, `canary-check`) finds nothing for the entity and its path | a path with two owners can never be indexed safely |
| 11 | `ssr_reliable` | ≥ 20 SSR checks and ≥ 99 % correct (200, one self-canonical, noindex while in canary) | soft-404s and render timeouts cost crawl trust |
| 12 | `user_useful` | a substantial description (criterion 4, not a copy) **and** at least one upcoming broadcast | what the visitor gets that the EPG grid alone does not: the story and where to watch it |
| 13 | `adsense_risk` | `low`: substantial text **plus** manual editorial text or a real programme schedule. `medium` is `unknown` | AdSense "low value content": scaled, thin or duplicated pages |
| 14 | `source_attributed` | the copied facts carry a recorded source and the page shows TMDB's required notice and the freshness date (Phase 3D) | third-party data without attribution breaks the source's terms and reads as scraped |
| 15 | `original_value` | a person's text ≥ 300 characters, or at least one **evidence-joined** upcoming broadcast with a channel link (Phase 3D) | a long TMDB synopsis alone is not original value: the page's own contribution is the schedule |

### AdSense / helpful-content risk

- **high** — no synopsis, under 150 characters, or a copy of the EPG listing.
- **medium** — 150–299 characters, or third-party text (TMDB is on thousands of sites) with neither a schedule nor editorial text beside it.
- **low** — ≥ 300 characters plus manual editorial text or at least one upcoming broadcast.

A medium or high page is never an `index_candidate`. High-risk pages must not be shown even in a canary the owner wants to measure.

## What this means today (measured 2026-10-21)

Catalogue rows behind the 519 distinct works the evidence gate accepted over 20261020–23 (read-only counts, no text):

| | films (405) | series (114) | all (519) |
|---|---|---|---|
| required metadata present (criterion 8, any synopsis length) | 373 (92.1 %) | 107 (93.9 %) | 480 (92.5 %) |
| …and synopsis ≥ 300 characters | 213 (52.6 %) | 44 (38.6 %) | 257 (49.5 %) |
| synopsis < 150 characters or missing (AdSense risk **high**) | 35 | 20 | 55 (10.6 %) |
| catalogue row sourced `epg` rather than `tmdb` | 330 | 56 | 386 (74.4 %) |

Genres 99.4 %, year 99.8 %, runtime 86.5 %, cast 91.7 %, directors 76.7 %, poster 99.4 %, original title 94.6 %.

No accepted work can be an `index_candidate` yet, whatever its text:

1. **No identity is human-verified** (0 labels), so criterion 1 fails everywhere.
2. **Year provenance is unmeasured** for all of them (`EPG_YEAR_PROVENANCE` is off), so criterion 3 is `unknown`.
3. **No internal link points to an entity page** (3A added none) and **legacy pages stay live** for the same works (criteria 7, 9).
4. Roughly half have a synopsis long enough, and the text is third-party (TMDB), so criterion 13 depends on the upcoming-broadcast block (not built into the entity page) or editorial text.

Reaching the `canary` tier needs only identity, canonical and SSR evidence; it exposes nothing to search engines. `index_candidate` is a Phase 3C decision with its own evidence.
