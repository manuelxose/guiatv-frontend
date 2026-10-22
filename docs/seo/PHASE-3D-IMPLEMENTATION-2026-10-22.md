# Phase 3D: entity enrichment, EPG integration and SEO readiness (2026-10-22)

Written for: the owner and the engineers who will run the first public canary. Contract: [PHASE-3-ENTRY-CONTRACT.md](PHASE-3-ENTRY-CONTRACT.md). Artefacts: [phase-3d/](phase-3d/README.md).

| Category | Status |
|---|---|
| Engineering | **Complete** in this PR: enrichment pipeline, evidence-joined broadcasts, read-time legacy guard, entity page, per-film report, ops visibility |
| Data | The 20 canary films enriched and evaluated **on scratch MongoDB from fixtures** (committed TMDB checks + public API snapshot). **No production database was read or written**: the authorisation classifier refused production reads, as in 3B/3C |
| Human approval | Open and owner-only: any grant (the evidence changed, §9: **a new signature is needed**) |
| Production activation | **None.** Every `CONTENT_*` / public-read / `EPG_YEAR_PROVENANCE` flag stays unset; no entity page published; no sitemap entry; no identity write |

## 1. The finding that shaped this phase

The legacy catalogue page is `index, follow` exactly when it lists an airing today or tomorrow (`catalogRobotsPolicy`). Between the 3C probe (2026-10-21 19:51 UTC) and the refresh (23:15 UTC) the legacy page of **10 of the 20 films became indexable** (6 pages measured, 6/6 matching the prediction; the other 14 predicted by the same rule). A same-URL entity page would have replaced 10 indexable pages with noindex ones. The 3C batch was therefore **time-dependent**, and the safeguard had to be **per request**, not per batch.

## 2. Metadata enrichment (priority 1)

`domain/services/entityEnrichment.ts` (pure), `application/services/ContentEntityEnrichment.ts`, `content-certify enrich`.

- **Source**: the existing media catalogue row (`media_catalog`), filled by `MediaCatalogService` from TMDB. No new metadata store. `--refresh-catalogue` (opt-in, needs `--apply` and `TMDB_API_KEY`) calls `MediaCatalogService.getDetail` for rows never fully fetched; the default makes **no network call**.
- **Binding check before any copy**: entity is a live movie with a TMDB ref; row TMDB **type and id** equal the entity's; the entity title's identity key is the row's title or original title; years both present and within ±1 (a remake 20 years away is refused); the row has `lastEnrichedAt` (set only by a full TMDB fetch). `metadataSource` is **not** used as provenance: it is the catalogue's *last writer* (an EPG search match flips it to `epg` over rich TMDB data; this is why 74 % of rows read `epg`). Refusals are listed, never forced: `source_missing`, `source_not_enriched`, `tmdb_type_mismatch`, `tmdb_id_mismatch`, `title_mismatch`, `year_unverifiable`, `year_mismatch`, `unsupported_kind`, `no_tmdb_ref`, `entity_not_live`.
- **Copied** (each with `source: tmdb` and the source's own freshness timestamp): synopsis, genres, runtime, TMDB-relative artwork paths (a non-TMDB path, e.g. a feed image URL, is dropped), directors and top cast. `originalTitle` is filled only if empty. Absent stays absent; a `manual` value is never overwritten and survives invalidation.
- **Deterministic refresh / invalidation**: digest of the copied fields + catalogue row id + enrichment version. Same digest and fresh (≤ 30 days) = no write; changed source, version or age = refresh; `enrich --invalidate` withdraws the copy.
- **Write path**: `replaceMetadata` is optimistic on `version`, live entities only, and never touches identity, status, certification or path. Enriching a certified entity leaves the attestation valid (tested). Writes need `--apply` **and** the existing `CONTENT_ENTITIES_ENABLED` + `CONTENT_IDENTITY_WRITES=<db>`; every other command runs under the read-only guard.
- **Public DTO** (additive): `originalTitle, year, synopsis, genres, runtimeMinutes, tmdbId` (only for an enriched entity), `images` (TMDB URLs), `credits`, `attribution` (TMDB's notice + freshness date), `broadcasts`. Nothing about matching, certification, hashes or catalogue ids.
- **Real-data result (scratch, fixtures of the 20 films)**: 20/20 written, 0 refusals; repeat = 20 unchanged; every attestation still valid.

## 3. Upcoming broadcasts (priority 2)

`application/services/EntityBroadcastService.ts`, one indexed query per entity (`idx_tvread_tmdbid_date`, 9 Madrid days, limit 40; measured on scratch with 3,000 noise airings: ≤ 40 documents examined, index used). No per-airing lookups (channel data is embedded in the read-model row).

An airing is a broadcast of the entity only on evidence: same TMDB id **and** the same title key **and**, when the entity is enriched, the same catalogue row (`program.mediaId`: a TV series that reuses the number is excluded), or an explicit `program.entityId`. Rejections are counted by reason. Evidence levels: `entity_ref`, `catalogue_media`, `tmdb_title` (entity not enriched yet, the weaker case, labelled). Expired broadcasts are dropped at read time; times are UTC in storage and also given in Europe/Madrid with the offset in force (CET/CEST), tested across 2026-10-25 and 2026-03-29. A failed read answers `unavailable`, never "none". **Production airing-reference writes are untouched** (`CONTENT_IDENTITY_AIRING_REFS` unset; the join does not need them). **Limits, stated plainly.** (1) `program.tmdbId` is itself set upstream by the EPG's TMDB search (re-confirmed against the catalogue); the join adds an exact title key and the catalogue row on top of it, so it is deterministic and labelled but **not independent of the EPG's own match**; the read model carries no year to check. `entity_ref` (airing references) would be the independent evidence and stays off. (2) Result on the 20 films: 13 broadcasts joined, all `catalogue_media`: **by construction** of the fixture (the airings are the ones the legacy payloads list, with the catalogue row id injected), so "13 = 13" shows the join does not lose or add rows, **not** that production airings were tested. (3) The snapshot lists only today and tomorrow; the production 7-day window may show more broadcasts than the report does.

## 4. Legacy consolidation (priority 4)

- **Runtime guard** (`entities.routes.ts`): in canary **and** all scope, if the legacy page would be indexable now (a TMDB-id row on today or tomorrow, counted on the id alone as the legacy lookup does) or the read model cannot be read, the API answers "disabled" and the **legacy page renders**. Outcome counter `legacy_indexable` in the admin stats. The guard predicted the legacy robots of **20/20** films in the rehearsal.
- **Audit** (`ContentEntityReport.ts`): per URL, serve the entity only if the legacy page is not indexable, the canonical path is the same, and nothing the legacy page shows is lost (synopsis length, up to 10 cast, director, poster, backdrop, broadcasts). Unmeasured legacy = keep legacy.
- Existing redirects, canonical ownership and indexability are untouched; the entity URL is the legacy URL, one self-canonical, noindex.
- **Monitoring**: `entity-canary-verify.mjs` treats an indexable legacy page at an allowlisted path as the guard working; a noindex non-entity page is still a failure.
- **Limit of the guard**: it mirrors the TMDB-id path of the legacy page (`airings` today/tomorrow). The legacy page is also `index` when it resolves as a *programme-sourced* page (the fallback when TMDB search returns nothing, `catalogRobotsPolicy` `source==='program'`); for an entity with a catalogue TMDB id the legacy resolver takes the TMDB path first, so this is an edge, but the guard cannot see it, nor a page Google indexed earlier that is noindex at this moment (that needs Search Console data, not available here). Alias → canonical 301s are not guarded (the canonical page itself is, when visited).
- Known consequence: the entity view appears only while no broadcast is within today/tomorrow, and SSR may keep the legacy answer up to 10 min fresh / 30 stale.

## 5. Entity page (priority 3) and SEO / SSR (priority 6)

`pages/entity-detail`, `components/entity-broadcast-list` (reusable), `entity-detail.model.ts`. Hero with licensed TMDB backdrop/poster, title, original title, year, runtime, genres, synopsis; **Próximas emisiones** (channel link, Madrid day and time, duration, time until, "emitida como" when the guide names the film differently); availability via the existing `where-to-watch` block; credits; internal links (qué ver hoy, películas, canales; channel links from broadcasts); attribution footer. Loading skeleton (polite status), empty, unreadable-schedule and 404/410/503 states; legacy fallback unchanged. No editorial links: no post is linked to a film by id, so none is shown. No fabricated recommendations. Channel links only: the read model offers no programme page distinct from the film page (`/contenido/program:*` redirects to it), so there is no programme link to give. "Dónde ver" reuses the existing availability block because the legacy page shows it (dropping it would be a regression the consolidation audit forbids); "Sigue explorando" is static navigation to existing hubs, not editorial or recommendation content.

- **Headers/meta**: `X-Robots-Tag` and `<meta robots>` `noindex, follow`, `no-store`, single self canonical (none on error states), SSR 301 only to a validated site path. Title `"<title> (<year>) - Guía TV"`; description leads with the next broadcast when there is one.
- **Structured data**: `Movie` from stated facts only (name, alternateName, description, image, genre, datePublished = year, duration, director, actor) plus the broadcasts as `publication` `BroadcastEvent`s; no rating, language or id invented; BreadcrumbList. Validated structurally (allowed-property lists in `entity-detail.model.spec`; parsed from the real SSR HTML). Not run through Google's Rich Results test (needs network and an indexable page).
- **Security fix found while testing**: 13 components serialised JSON-LD into `<script>` with `JSON.stringify` and `bypassSecurityTrustHtml`; a title containing `</script>` closed the element (the test executed an `onerror`). New shared `serializeJsonLd` escapes `<`; all 13 sites use it (pre-existing weakness, fixed once at the root).
- **Other fix**: the shared breadcrumb was unreadable on the dark hero (embedded mode); it now uses the hero tokens.

## 6. UX validation

Playwright desktop (Chrome) and mobile (Pixel 5) against the **real SSR bundle** and a fake API (`playwright.entity.config.ts`, added to the SEO regression workflow): content, one h1, noindex, one canonical, channel links, relative times, keyboard focus, **axe wcag2a/aa/21aa: 0 violations in light and dark** (page content), text contrast ≥ 4.5 in both themes, no horizontal scroll at mobile width (also with a very long title), one-column cards, tap targets ≥ 24 px, breadcrumb navigation, all states. 11 passed, 1 skipped by design (mobile-only test on desktop). Screenshots reviewed (desktop light, mobile dark).

## 7. Legacy and quality results for the 20 films

Evaluated on scratch at 2026-10-21T23:31Z with the existing evaluator (no threshold changed; two criteria added that only add requirements: `source_attributed`, `original_value`). Full JSON: [phase-3d/film-quality-report.json](phase-3d/film-quality-report.json).

| # | Film | Path | Enrichment | Synopsis chars | Genres | Runtime | Broadcasts | Legacy | Consolidation | AdSense risk | Verdict | Verdict blockers |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | La cura del bienestar | `/peliculas/la-cura-del-bienestar` | written | 491 | 3 | yes | 2 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 2 | Venganza en Las Vegas | `/peliculas/venganza-en-las-vegas` | written | 350 | 1 | yes | 2 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 3 | Dobles vidas | `/peliculas/dobles-vidas` | written | 474 | 3 | yes | 1 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 4 | Los subdesarrollados | `/peliculas/los-subdesarrollados` | written | 431 | 1 | yes | 1 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 5 | La galaxia del terror | `/peliculas/la-galaxia-del-terror` | written | 420 | 4 | yes | 1 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 6 | Jinetes de la justicia | `/peliculas/jinetes-de-la-justicia` | written | 377 | 4 | yes | 1 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 7 | El exorcista III | `/peliculas/el-exorcista-iii` | written | 371 | 1 | yes | 1 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 8 | 22 balas | `/peliculas/22-balas` | written | 362 | 3 | yes | 1 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 9 | Jurassic World: Dominion | `/peliculas/jurassic-world-dominion` | written | 344 | 3 | yes | 1 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 10 | ¿Cómo se escribe amor? | `/peliculas/como-se-escribe-amor` | written | 324 | 2 | yes | 2 | index | keep_legacy | low | hold_legacy | consolidation:legacy_indexable_now |
| 11 | Baño de sangre al salir el sol | `/peliculas/bano-de-sangre-al-salir-el-sol` | written | 449 | 1 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 12 | AmeriGeddon | `/peliculas/amerigeddon` | written | 418 | 2 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 13 | Las catadoras de Hitler | `/peliculas/las-catadoras-de-hitler` | written | 418 | 2 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 14 | Morir no siempre sale bien | `/peliculas/morir-no-siempre-sale-bien` | written | 376 | 1 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 15 | El valle de la furia | `/peliculas/el-valle-de-la-furia` | written | 353 | 3 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 16 | Bats (Murciélagos) | `/peliculas/bats-murcielagos` | written | 337 | 3 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 17 | Suzhou River | `/peliculas/suzhou-river` | written | 315 | 2 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 18 | Pecados del pasado | `/peliculas/pecados-del-pasado` | written | 314 | 4 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 19 | Tres tejanos | `/peliculas/tres-tejanos` | written | 312 | 1 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |
| 20 | El desafío de Pancho Villa | `/peliculas/el-desafio-de-pancho-villa` | written | 301 | 1 | yes | 0 | noindex | serve_entity | medium | hold_quality | original_value, user_useful |

**Verdicts: 0 `show_noindex`, 10 `hold_legacy`, 10 `hold_quality`, 0 index candidates.** The first ten films have broadcasts and complete facts but their legacy page is indexable now; the other ten have a noindex legacy page but **no broadcast in the snapshot** (today and tomorrow only), so on this evidence the entity page is only the TMDB text and facts: no original value, AdSense risk medium. That is a statement about the snapshot, not about the 7-day production view, which was not readable. The enrichment 20/20 is also a fixture result (catalogue rows assembled from TMDB checks and the payloads, `lastEnrichedAt` = payload time); the real catalogue rows were not read. A long TMDB synopsis alone does not pass. Indexing blockers for every film: AI-attested identity (not person-verified), year provenance unmeasured, legacy page live at the same URL, no inbound internal links, SSR reliability not measured at scale, no EPG description to compare. `tier` is `blocked` for all 20 because `ssr_reliable` needs ≥ 20 production-like SSR checks (the Playwright/SSR tests are fixtures, not that measurement).

## 8. `EPG_YEAR_PROVENANCE` (priority: validation only)

Validated on scratch with the real enrichment, repository and read-model builder, flag off/on/off: **read model byte-identical; `year` unchanged; `sourceProvenance.yearProvenance` stored only with the flag on.** Reversible one-cycle runbook: [PHASE-3D-YEAR-PROVENANCE-RUNBOOK.md](PHASE-3D-YEAR-PROVENANCE-RUNBOOK.md). Flag not enabled.

## 9. Canary evidence refresh

[phase-3d/EVIDENCE-REFRESH.md](phase-3d/EVIDENCE-REFRESH.md). Changed: legacy status of 10 films. **New manifest `f5341ad8…` (10 films), reproducible from committed inputs (test), digest differs from `03fa1569…`, so the 3C grant covers nothing and a newly signed owner authorisation is required. Nothing was signed.** Not refreshed: the verdict replay and the other 72 probes (production reads refused); `freshUntil` stays 2026-10-25 (`--evidence-produced`), and no replacement films were drawn on stale data. The owner-run steps to finish are in the document.

## 10. Operations

- Webhook-independent visibility: each probe run writes its table to the run summary; the `report` job opens one "Production uptime alert" issue on failure, comments on repeats and closes it on recovery (`issues: write` on that job only; the probe stays read-only).
- Post-boot diagnostics (`guiatv-post-boot.service`) exist and are **still not installed** on the VPS (ops step); external probe exists. Docs-only deploy safeguards exist (3C). Artifact deploy documented as the **preferred** path in the runbook; `deploy.yml` still builds on the host.
- **Contabo outage: unresolved.** No provider answer, no new evidence; recorded as such in the runbook. No rollback drill, reboot or redeploy was performed.

## 11. Tests and CI

| Check | Result |
|---|---|
| Backend (`npm test`, scratch MongoDB 8) | **593 tests: 591 pass, 1 skip (existing Redis skip), 1 fail**, run twice: `SyncEPGData.icon-cache-deferred` "icon fetches … bounded concurrency" (a timing test in code this PR does not touch) fails under whole-suite load on this 6 GB WSL and **passes alone** (2/2, both runs); judged a load flake here, CI is the arbiter |
| New backend coverage | enrichment rules (9), broadcasts incl. DST (9), report/consolidation (5), quality criteria, manifest refresh and freshness pin (2), scratch integration: enrichment + indexed query + guard + DTO + invalidation (9 steps), 20-film rehearsal (29 checks, all pass), year provenance on scratch |
| Backend typecheck | pass |
| Frontend Karma | 300/300 (277 before; +23) on a Windows clone (WSL memory) |
| SSR (real bundle) | `entity-read-ssr.test` 2/2 + `ssr-cache`, `ssr-canonical`, `entity-canary-verify` (4) pass |
| Playwright entity, desktop + mobile | 11 passed, 1 skipped by design |
| Ops tests | 14 pass (new: issue-based alerting guarantees) |
| Not run | deploy sandbox script test (script unchanged), production smoke, live rollback drill, Google Rich Results test, `graphify update` (the CLI is not installed here; the graph still reflects commit 16184a0c) |

CI results for the PR: see the PR (filled in when the checks complete).

## 12. Production flags and database state

Unchanged by this phase and **not observed** during it (no production access was used): all `CONTENT_*`, `EPG_YEAR_PROVENANCE`, public-read, canary variables unset; 40 collections / 272 indexes and no `content_*` collection as measured after the 3C deploy. New code is inert with the flags off: the public read returns the legacy signal before reaching it, and no new index or collection is created at boot.

## 13. Remaining blockers and next step

1. Owner-only: a new signed grant (new digest), separate approvals for enabling collections, the admitted write run, `enrich --apply`, `certify --apply`, and any public canary.
2. Evidence: re-run the production replay and the 92-URL probe (owner or authorised operator, steps in EVIDENCE-REFRESH.md) before 2026-10-25.
3. Product decision the data forces: a canary whose pages are shown only while the legacy page is noindex and which have scheduled broadcasts is a small and moving set. **Recommendation for the next phase: do not publish entity pages at legacy URLs; instead consolidate the verified metadata and the evidence-joined broadcast block into the *legacy* page (one page, one URL, content strictly additive), behind the same flags, and measure SSR reliability there.** That removes the replacement risk, keeps the indexable pages indexable, and gives the original value (schedule) to the pages Google already ranks. Entity pages for works with no legacy page can follow.
4. Ops: install the post-boot unit, decide on switching `deploy.yml` to artifacts, file the Contabo ticket.
