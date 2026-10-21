# Phase 3 entry contract — content identity (v1.3, 2026-10-21)

Status: **engineering readiness PASS · production activation BLOCKED** (no persistent write is authorised; every identity flag is unset in production). Evidence for every claim is in [PHASE-2D-FINALIZATION-2026-10-21.md](PHASE-2D-FINALIZATION-2026-10-21.md). Changing a rule below needs a new version of this file.

**v1.1 (Phase 3B):** (a) `CONTENT_ENTITY_PUBLIC_READ_ENABLED` alone no longer serves anything: a scope (`canary` or `all`) must be written out, and `canary` needs an allowlist file and a ceiling ≤ 25 (§7a); (b) the evidence gate never accepts an identity without a canonical path (§3). No other rule changed; the human gate is unchanged. Details: [PHASE-3B-IMPLEMENTATION-2026-10-21.md](PHASE-3B-IMPLEMENTATION-2026-10-21.md).

**v1.2 (owner-authorised AI review):** on 2026-10-21 the owner (manuelxose) authorised AI agents to perform the human review of the identity gate ("toda la revision humana es autorizada por mi para hacerlo por ia"; "ahora te doy la autorizacion"). Consequences, and only these: (a) the review ledger accepts reviewers named `AI <model> <letter>` listed in a roster that carries the owner's `aiAuthorization`; (b) the scorer takes an explicit opt-in list of AI reviewer names, so thresholds (300 labels, 98 %, 50 second-reviewer rows, categories, adjudication) are unchanged; (c) every ledger entry says `reviewerKind: 'ai'` and reports say `reviewBasis: ai`: AI labels are **ai_reviewed, never "human-validated precision"**; (d) `normalizeReviewerName` now also refuses the `AI ` prefix, so `verifyEntity`, public reads and the canary still need a named **person** — making an AI-reviewed entity publicly readable is a separate, explicit Phase 3C change. The independent evidence an AI reviewer uses is the TMDB page of the claimed work, not the machine's verdict; TMDB is also the gate's source, so the labels measure coherence with TMDB, not TMDB's own errors.

**v1.3 (owner attestation):** after the AI review passed (round 2: 360 labels, 99.7 %, 119 second reviews, basis `ai`), the owner stated, in this session on 2026-10-21, that the human-review requirement is satisfied ("valida que el requisito humano ha pasado, te lo digo yo"). This is recorded as the **owner's decision**, not as a human labelling result: reports keep `reviewBasis: ai` and nobody should describe the precision as human-validated. It closes the "human gate" line of §10 for planning purposes; it does not enable any flag, write or publication, and §8's written authorisations for those remain separate.

## 1. Final Phase 2D architecture

```
XMLTV → EPG sync → programs → TvReadModelBuilder.rebuildDate ─┬→ tv_read_airings   (unchanged public output)
                                                              └→ runContentIdentity(date, airings, years, rawYears)   never throws
                                                                   parseEpgTitle → work key + episode evidence
                                                                   candidates (key + kind + TMDB work + year)
                                                                   decideIngestionMatch → title-key rows
                                                                   ADMISSION GATE (write mode) → entity + canonical slug
offline, no database:  trace-dump.js → tmdb-check.js → `content-identity evidence` → verdicts.jsonl ──(CONTENT_IDENTITY_ADMIT_FILE)──┘
```

| Piece | Where |
|---|---|
| Pure rules (title parse, kinds, paths, lifecycle, indexability guard) | `domain/services/contentIdentity.ts` |
| Collections: `content_entities`, `content_slugs` (path registry, source of truth), `content_title_keys` | `infrastructure/database/models/Content*.model.ts` |
| Repositories (insert-only, unique-index guarded, no transactions) | `infrastructure/repositories/MongoContentIdentityRepositories.ts` |
| Service: create/merge/remove, `resolvePath`, `verifyEntity`, review | `application/services/ContentIdentityService.ts` |
| Ingestion (shadow / write, admission gate) | `application/services/ContentIdentityIngestion.ts` |
| Evidence gate (offline, provenance-aware) | `application/services/ContentIdentityEvidence.ts` |
| Human scorer (the write gate, unchanged) | `application/services/ContentIdentityAudit.ts` |
| Rollback of provisional entities | `application/services/ContentIdentityRollback.ts` |
| Ops CLI | `dist/scripts/content-identity.js` (`shadow`, `evidence`, `score`, `queue`, `pathless`, `approve`, `reject`, `verify`, `rollback`) |

**No HTTP route, SSR path, sitemap, canonical or API reads an entity.** `ContentIdentityService` is imported only by ingestion and the CLI.

## 2. Identity tiers and lifecycle

| Tier | Stored as | How it is reached |
|---|---|---|
| **Verified** | entity `active`, `matching.method = manual`, `lifecycle.changedBy` = a named person | `verifyEntity` / `content-identity verify <id> --by <name> --note …`; refuses automation names (`normalizeReviewerName`) |
| **Independently supported** | entity `candidate`, `matching.assurance = independently_supported` | the evidence gate's `AUTO_ACCEPT` listed in `CONTENT_IDENTITY_ADMIT_FILE` |
| **Provisional** | entity `candidate`, no `assurance` | only legacy 2D-2 behaviour; the gate no longer creates these (tests may, with `admit: 'all'`) |
| **Quarantined** | no entity. Report: `decisions.unresolved` with `reasons` (`not_admitted`, `unknown_kind`, `title_uncertain`, `cross_kind_conflict`, `tmdb_conflict`…); title-key rows `ambiguous` / `manual_review` | everything else; stays here until evidence or a person changes it |
| **Rejected** | title-key row `rejected` (a person), or trace `rejected` (slot / episode-without-work / unkeyable title, never a row) | `content-identity reject`; exclusion rules |

Entity status transitions (`canTransition`): `candidate → active | merged | removed`, `active → merged | removed`, `removed → active`, `merged` terminal (always points at an `active` entity, one redirect hop). Writes are optimistic (`version`) and ordered single-document operations: entity → canonical slug → cached `canonicalPath`; a crash leaves a state the next run completes.

Only a person moves a candidate to `active`. Merge, removal and restore are `ContentIdentityService.transition`.

Rollback: `content-identity rollback [--since ISO] [--apply]` (dry run by default) deletes **candidates only**, with their slugs and unreviewed title-key rows, entity last. It keeps `active/merged/removed` entities, candidates with a person-reviewed title key, and candidates an airing references (`program.entityId`).

## 3. Evidence requirements

- **Independently supported** (the only machine `AUTO_ACCEPT`), all of: TMDB lists exactly one work of the type whose title, original title or alternative title has the key; at least one consistency check against broadcaster data passed (film runtime vs slot, EPG season ≤ TMDB seasons, TMDB TV genres giving a decisive kind, feed year vs TMDB year once raw years exist); the kind comes from `tmdb_runtime` or `tmdb_genres`, never from the XMLTV category alone; no contradiction; a safe canonical path. Items sharing a root count once. Title-only works can never qualify.
- **Provenance classes** (never independent: `epg_title`, `tmdb_guess`, `legacy_url`; independent: `broadcaster_feed`, `tmdb_index:<work>`, `manual`). AI output is never evidence and never a label.
- **Verified** needs a named person. The human write gate (`score --verify`: ≥300 labelled rows, ≥98% precision, ≥50 rows verified by a second reviewer, error categories) is **unchanged and unmet (0 labels)**.
- Machine verdicts are per proposed entity: one contradicting candidate quarantines all of it. Gate violations (`canonicalOwnership`, `crossKindMerges`, `episodeAsWork`, `circularIndependence`, `unsupportedTmdb`, `kindUnverified`, `acceptedWithConflicts`) must be empty; the CLI exits 2 otherwise.

## 4. API and persistence contracts Phase 3 may reuse

Stable, tested on scratch MongoDB:

- `ContentEntityRecord`, `ContentSlugRecord`, `TitleKeyRecord` (`domain/repositories/IContentIdentityRepository.ts`). `matching.assurance` is optional and additive.
- `ContentIdentityService.resolvePath(path) → PathResolution`: `canonical` (active entity serving its own path), `redirect` (one hop to the active canonical), `gone` (removed or `gone` slug), `not_found` (unknown path **or a candidate**), `invalid`, `integrity_error`. A provisional entity never resolves.
- `createContentIdentityService()` returns `null` while `CONTENT_ENTITIES_ENABLED` is off: callers must keep the legacy path.
- `mayBeIndexable(entity)`: active **and** (`manual` **or** TMDB `tmdb_id`/`tmdb_exact` with confidence ≥ 0.95). Machine-admitted entities carry `tmdb_exact` at 0.9, so they can never pass it; only `verifyEntity` does.
- Idempotent ingestion keyed by `candidateId = key|kind|tmdbType:tmdbId|year` and title-key id `key|kind|discriminator`; replay creates nothing new.
- Airing references (`program.entityId`, `program.canonicalPath`) are optional, validated, and written only with `CONTENT_IDENTITY_AIRING_REFS` and the hand-built index `idx_tvread_entity_start`.

Phase 3 must add its own public DTO; it must not serialise `ContentEntityRecord` (it carries `matching`, `lifecycle`, versions).

## 5. Canonical ownership

- One canonical path per entity (unique `(entityId, role=canonical)`); the slug registry is the source of truth, `entity.canonicalPath` a repairable cache.
- A path is **never** reassigned automatically. `planCanonicalPaths` refuses a path a legacy GuíaTV page already answers for another work (`historic_conflict`, `historic_ambiguous`, `historic_unverified`), reserved slugs, and bare slugs for title-only films and remakes. The entity then stays **pathless and unresolvable**.
- Kind prefixes: `/peliculas`, `/series`, `/programas`, …; cross-kind twins are held, never given two paths.
- Redirects only to an active canonical, never a loop, never over an existing path. Reassignment is manual, reviewed and audited.
- Measured on production 20261020: 224 of 1,662 proposed entities pathless (213 `historic_unverified`, 5 `historic_ambiguous`, 4 `historic_conflict`, 2 `unsupported_slug`), **none** among the 163 accepted; 0 canonical collisions among the accepted.

## 6. Publication and indexing eligibility

| Tier | Internal storage | Public resolution | Search-engine indexing |
|---|---|---|---|
| Quarantined / rejected | no entity (review row only) | no | no |
| Provisional | yes, `candidate` | no | no |
| Independently supported | yes, `candidate` + `assurance` | no | no (never eligible: `mayBeIndexable` false) |
| Verified (`active`, manual) | yes | **only after Phase 3 adds a public route behind its own flag** | eligible, not indexed: `indexability.state` stays `noindex` until Phase 3 sets `index` after its own publication checks (self-canonical, sitemap, content quality) |

Nothing in 2D publishes or indexes anything. Phase 3 must not index an entity whose canonical path is missing or whose entity is not `active`.

## 7. Feature flags and dependencies

| Flag | Default | Requires | Effect |
|---|---|---|---|
| `CONTENT_ENTITIES_ENABLED` | off | — | boot creates the three collections and their indexes (`createIndexes`, never drops) |
| `CONTENT_IDENTITY_SHADOW` | off | — | reads and logs a report per rebuilt day; no write |
| `CONTENT_IDENTITY_WRITES=<db name>` | unset | `CONTENT_ENTITIES_ENABLED`; value must equal the connected database name | writes title keys / review rows; **creates no entity by itself** |
| `CONTENT_IDENTITY_ADMIT_FILE=<path>` | unset | `…WRITES` | verdicts file from `content-identity evidence --out`; only `AUTO_ACCEPT` + `independently_supported` lines admit. Missing, unreadable or broken file admits nothing |
| `CONTENT_IDENTITY_MAX_CREATES` | 1000 | `…WRITES` | cap per rebuild |
| `CONTENT_IDENTITY_AIRING_REFS` | off | `…WRITES` and the hand-built airing index | writes `program.entityId` / `canonicalPath` on airings |
| `EPG_YEAR_PROVENANCE` | off | — | the sync keeps the feed's year in `sourceProvenance.yearProvenance` of enriched programmes (changes stored EPG documents; `year` and public output unchanged) |

There is no public-resolution flag. Phase 3 introduces its own, off by default.

### 7a. Public-read flags (Phase 3B), all default off

| Flag | Requires | Effect |
|---|---|---|
| `CONTENT_ENTITY_PUBLIC_READ_ENABLED=true` | — | master switch; with no scope it serves nothing |
| `CONTENT_ENTITY_PUBLIC_READ_SCOPE=canary\|all` | the master switch | `all` = every eligible entity (3A behaviour); `canary` = the allowlist only |
| `CONTENT_ENTITY_CANARY_FILE`, `CONTENT_ENTITY_CANARY_MAX` | scope `canary` | allowlist of named approvals, ceiling 1…25 |
| `CONTENT_ENTITY_PUBLIC_READ_KILL=true`, `CONTENT_ENTITY_KILL_FILE` | — | instant legacy fallback, no restart |

## 8. Production activations (all optional for Phase 3 engineering)

Each needs separate written owner authorisation. None is done.

1. `EPG_YEAR_PROVENANCE=true`; after one sync cycle, compare population of the new field; rollback: unset (fields inert).
2. Hand-build `idx_tvread_entity_start` off-peak, before any release that expects it, if airing refs are wanted.
3. Write canary: `CONTENT_ENTITIES_ENABLED=true`, `CONTENT_IDENTITY_WRITES=guiatv`, `CONTENT_IDENTITY_ADMIT_FILE` from a fresh evidence run, `CONTENT_IDENTITY_MAX_CREATES≤50`. Prerequisite: the human gate passes on a sheet drawn from the `independently_supported` population, **or** the owner accepts policy M1 below. Rollback: unset flags, restart, `content-identity rollback --apply`.

**Policy M1 — machine-only canary [not in force; separate from the human gate].** Population: `independently_supported` films only; ≤ 50 entities; stored as `candidate`, zero public exposure; the human sheet is run on exactly the written rows within 7 days; any error in a critical field triggers `rollback --apply` and suspends M1. Risks: precision unknown when writing (the 163 are machine-checked, not labelled); TMDB errors propagate; a homonym outside TMDB's top results is undetectable.

## 9. Known limitations and accepted risks

- TMDB is the only external identity source; a work missing from it is undetectable. The independent checks are consistency checks, not identifiers.
- 348 title-only works have no independent route; 1,335 candidates have unknown kind and are never proposed.
- Verdicts describe one day's contexts. The admission file must be regenerated (evidence is not permanent); a context admitted once stays admitted on later days until the file changes.
- The raw-year check never fires until `EPG_YEAR_PROVENANCE` has been on for a sync cycle; historical raw years are lost.
- `editorialCategory` mixes broadcaster and TMDB data and is public; identity reads the raw XMLTV `genre` instead.
- Rollback is not atomic against a concurrent verification (standalone Mongo, no transactions): run it in a quiet window. Its airing-reference check scans unless the airing index exists.
- Production MongoDB is standalone (8.0, no transactions); all guarantees rest on unique indexes and ordered single-document writes.
- Human-validated precision has never been measured.

## 10. Prerequisites for starting Phase 3

Engineering start (isolated or read-only data) — **all met**:

- [x] Lifecycle, resolution, ownership and rollback contracts above, tested on scratch MongoDB (469 → 477 backend tests, 0 failures; gate, verification, rollback, concurrency, crash recovery and idempotency covered).
- [x] Flags default off in production; no route, sitemap, SSR or API reads an entity.
- [x] Deterministic offline evidence replay (digest `d35e7caf…`, two runs and the 2D-2G artefact identical).

Production start (public pages, writes) — **not met**, owner-gated:

- [ ] Written authorisation to enable writes (§8.3).
- [ ] Human gate passed, or policy M1 accepted in writing.
- [ ] Fresh production replay of the latest rebuilt day with this build (blocked in this session: production database reads were refused by the environment; the packaged `docs/seo/phase-2d2f/run-evidence.sh` is ready for the owner).

**First Phase 3 task:** a public read DTO and `GET` resolver behind a new flag (off), built on `resolvePath`, serving only `active` entities with a canonical path, `noindex`, no sitemap entry, tested on scratch MongoDB seeded through `verifyEntity`.
