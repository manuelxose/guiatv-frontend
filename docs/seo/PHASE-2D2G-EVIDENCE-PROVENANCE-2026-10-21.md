# Phase 2D-2G: evidence provenance, TMDB verification, raw-year preservation (2026-10-21)

Status legend: **[V]** verified by a run recorded here, **[P]** proposed, not in force.

## 0. Summary

- **PR #39 (2D-2F) is merged** (squash `33c973d`) and deployed. Production identity flags are still unset, and production holds no `content_*` collection.
- **2D-2F overstated independence.**
  - A legacy GuíaTV URL proves nothing about identity: its owners are brand titles (EPG titles) and catalogue rows (TMDB guesses).
  - TMDB type agreeing with the XMLTV category is true by construction, because the sync picks the movie or TV search from that category.
  - "Series" can itself come from TMDB: the read model falls back to `tmdbKind`, and the sync writes the TMDB overview into `description`.
- **With provenance tracked** on the same production day, traces and evidence definitions:
  - 2D-2F accepted 529 of 1,662 proposed entities;
  - 2D-2G accepts **163 (9.8%)**, all independently supported: unique in TMDB including alternative titles, at least one independent consistency check passed, kind set by external data;
  - **0 gate violations** (including the new ones for circular independence, unsupported TMDB and unverified kind);
  - deterministic: two trace runs identical, verdicts identical, digest reproduced offline.
- **Of 2D-2F's 529 acceptances:**
  - 163 remain;
  - 357 are machine-supported only (335 title-only);
  - 9 are contradictory: errors 2D-2F let through.
- **Raw XMLTV year** is preserved behind a new flag, `EPG_YEAR_PROVENANCE`, off by default, in a separate PR that is **not merged**: turning the flag on changes stored EPG documents.
- **Human-validated precision is not measured, and the human write gate is unchanged and unmet.** Persistent identity writes remain **NO-GO**.

## 1. PR #39 integration [V]

- **Head:** `921e0fb`, CI `verify` and `ssr-resilience` green.
- **Audit before merge:**
  - no write, index or DDL call;
  - `ContentIdentityAudit.ts` (the human scorer) untouched;
  - no route, sitemap, canonical or SSR file;
  - the ingestion change only runs under identity flags, which are unset.
- **Merged** as squash `33c973d` and auto-deployed.
- **After the deploy:** health 200, flags unset, baseline 40 collections / 272 indexes, no `content_*`.

## 2. Denominators

The 2D-2F report gave "529 of 3,145 identities". The 3,145 mixed two levels: proposed entities, and candidates the run never proposes. The levels are now reported separately.

| Level (`20261020`) | Count | Meaning |
|---|---|---|
| Airings | 11,211 | EPG rows of the day |
| Excluded airings | 1,559 | slot 108, unkeyable 36, episode-only 45, sport 1,370 |
| Rejected slot titles | 48 | distinct generic titles (189 airings) |
| Candidates | 3,187 | one per identity context (key + kind + TMDB work + year) |
| Distinct work keys | 2,970 | normalised work titles |
| **Proposed entities** | **1,662** | what a write run would create |
| Candidates never proposed | 1,483 | unknown kind 1,335; uncertain title 119; cross-kind hold 29 |
| Accepted | 163 | **9.8% of proposed entities** |

## 3. Evidence provenance audit

**The chain:** XMLTV → EPG sync → media catalogue → TMDB match → read model → GuíaTV URL → identity acceptance.

| Information | Where it really comes from | Provenance class | Independent? |
|---|---|---|---|
| Title, key, slug, episode markers | the EPG title | derived (`epg_title`) | no |
| Same key on other days | the same rules on other EPG days | derived (`epg_title`) | no |
| Airing `tmdbId`, catalogue row | the sync's TMDB search by that title | derived (`tmdb_guess`) | no |
| `program.year` on enriched airings | overwritten with the matched TMDB year (`SyncEPGData.ts`) | derived (`tmdb_guess`) | no |
| `description`, `genreTags`, `image` on enriched airings | TMDB overview, genres and poster | derived (`tmdb_guess`) | no |
| `editorialCategory` | XMLTV genre + title + description (TMDB overview when enriched) + `trustFlags.tmdbKind` fallback | mixed | no |
| TMDB type vs XMLTV category | the sync chose `/search/movie` or `/search/tv` from the category | derived | no |
| Legacy URL ownership (`historicOwner`) | brand titles (EPG) and catalogue rows (TMDB guesses) | historic URL (`legacy_url`) | no: ownership only |
| XMLTV `genre` | feed category, `normalizeCategory` only | broadcaster | yes, as broadcaster data |
| Slot length, EPG season markers, channel | feed start/stop, titles, channel | broadcaster | yes, as broadcaster data |
| TMDB search uniqueness, details, alternative titles | lookups made for this check (`tmdb-check.js`) | external metadata (`tmdb_index:<work>`) | yes |
| Stored row verified by a named person | manual review | manual identity | yes (none exist) |
| Model output | AI | ai | never |

**Independently supported** requires all three of:
1. TMDB lists exactly one work of the type whose title, original title or alternative title has the key. Alternative titles are fetched for the bound work and up to 5 other results.
2. At least one consistency check between the TMDB details and broadcaster data passed:
   - film runtime vs slot (slot ≥ 75% of runtime, and ≤ 2.5×);
   - EPG season ≤ TMDB seasons;
   - TMDB TV genres giving a decisive kind;
   - feed year vs TMDB year, once raw years exist.
3. The kind follows from those sources (`tmdb_runtime` or `tmdb_genres`).

Items sharing a root count once. A unique search result alone leaves the work `machine_supported`. **Title-only works can never be independently supported.**

**Assurance categories:**
- `independently_supported`: the only `AUTO_ACCEPT`;
- `machine_supported`: consistent, all support derived;
- `contradictory`;
- `insufficient`;
- `rejected_slot`.

**New gate violations** (each tested with a planted case):
- `circularIndependence`: an accepted identity whose independent roots are all derived;
- `unsupportedTmdb`: accepted without the TMDB uniqueness item;
- `kindUnverified`: accepted with only the category deciding its kind.

## 4. TMDB verification [V]

Per bound work (`tmdb-check.js`, format 2):
- search, up to 3 pages, with genre ids;
- details (runtime or episode runtime, seasons, genres, year, alternative titles);
- alternative titles of up to 5 other same-type results.

All GET requests run 4 at a time with retries and a cache.

**Production:** 299 lookups, 1,089 requests, 0 retries, 0 failures.

| Check | Result on proposed entities |
|---|---|
| Homonyms, alternative titles included | 72 quarantined. 8 of them were accepted by 2D-2F; alternative titles exposed them (Bloodshot, Guillermo Tell, High Potential, La venganza del justiciero, Punto de control, Tú eres el siguiente, Un crimen perfecto, Inteligencia artificial: ¿Aliada o enemiga?) |
| Film slot shorter than TMDB runtime | 10 contradictory, e.g. **La Promesa**: the TVE telenovela, 60-min slot, category Series, bound to a 105-min film. Also Moros y Cristianos (30 < 116), Zona de Caza (28 < 89), Exploding sun (102 < 174), Matad a Johnny Ringo (80 < 130) |
| Same key bound to another TMDB id on another day | 1 (Todas las criaturas grandes y pequeñas: tv 108255 vs 7406) |
| Airing TMDB ids not confirmed / mixed in one entity | 36 / 7 (2D-2E rule, unchanged) |
| Bound id not among the exact-title results | 0 |

Every accepted and quarantined TMDB match has its lookups in `tmdb-checks-20261020.json` and its decision trail in `verdicts-20261020.jsonl`.

## 5. Raw XMLTV year [V in tests; not deployed]

Branch `feat/epg-year-provenance-2d2g`, separate PR:
- **Recording.** With `EPG_YEAR_PROVENANCE` on, every enrichment that sets `year` also records `sourceProvenance.yearProvenance = { rawXmltvYear, resolvedWorkYear, resolvedYearSource }` on the programme.
  - The raw year is kept from the first enrichment, so a later cache hit can't replace it with the TMDB year.
  - Equal years are recorded too, since that agreement is the evidence.
- **Unchanged:** `year` and every public output.
- **Off:** output is byte-identical to today (tested).
- **No schema change:** `sourceProvenance` is already a free-form field.
- **Identity side (this PR):** shadow runs read `rawXmltvYear` when present (CLI and `trace-dump.js`); the evidence step uses it as an independent film check (±1 year; a mismatch contradicts). Until the flag is on, no document has it and the check never fires.
- **Rollout [P]:** owner-authorised flag on, one sync cycle, then compare the new field's population on one day.
  - Rollback: unset the flag. Already-written fields are inert and nothing reads them publicly.
  - No backfill: historical raw years are lost.

## 6. Series vs show [V]

- **2D-2F's 412 accepted TV identities** rested on the broadcaster category: 317 shows and 95 series. **In 2D-2G no TV identity is accepted on the category.** The kind must come from decisive TMDB TV genres:
  - Talk, News, Reality → show;
  - fiction and animation → series;
  - Documentary or Family alone → undecided.
- **Accepted TV:** 57 series, 1 show (Food Factory).
- **Quarantined TV:**
  - 13 with undecided genres (`tv_kind_unverified`, e.g. La revuelta: Talk + Comedy);
  - 5 with TMDB genres contradicting the run's kind: Mésnit (show vs series), The Real CSI: Miami, Accidente suicidio o asesinato, Mujeres espías en la Segunda Guerra Mundial, El equipo A.
- **XMLTV category vs the run's kind:** 15 contradictions.
  - Examples: CINE IMÁS and El cine bélico de Boyero (category Cine; title-only shows); La chica de las series and Más de series (programmes classified as series by a title keyword); Els millers curtsFilmets (a short-film programme called a film).
  - The category is kept in the trace (`broadcaster.genres`).
- **No quarantined identity claims a path**, so none can take a path under the wrong prefix.

## 7. Adversarial validation

- **Deterministic first.** Every new rule was reproduced on production traces and covered by a test (§9). The 163 accepted were listed in full and read by the assistant, together with every new contradiction class. No accepted entry showed a wrong work, kind or episode-as-work.
  - **This was an AI review: advisory, not a label, and not counted anywhere.**
- **Multi-model critics** (`ContentIdentityAdjudication`, 2D-2F) were not run: no Anthropic key or spending approval exists. They can only quarantine, never accept.
- **Errors found in 2D-2F's accepted set** (the 9 contradictory): El equipo A, Accidente suicidio o asesinato, Mujeres espías…, The Real CSI: Miami (kind); Exploding sun, Matad a Johnny Ringo (slot vs runtime); CINE IMÁS, Jet Marte, Mareas vivas. A serie que cambiou a túa vida (category vs kind).

## 8. Production replay and comparison [V]

The replay ran on 2026-10-21 (`phase-2d2f/run-evidence.sh`, build = this branch).
- **Target day:** `20261020`, run twice, no creation cap.
- **Other days:** 20261013 and 20261016–19.
- **TMDB:** fresh lookups in the new format.

| Metric | 2D-2F rules | 2D-2G rules |
|---|---|---|
| Same traces and TMDB data | yes | yes |
| Proposed entities | 1,662 | 1,662 |
| Accepted (proposed entities) | 529 (31.8%) | **163 (9.8%)** |
| Of which films / series / shows | 117 / 95 / 317 | 105 / 57 / 1 |
| Kind basis of accepted | category 412, TMDB type 117 | TMDB runtime 105, TMDB genres 58 |
| Machine-supported only | n/a | 421 (title-only 348, homonyms 72, undecided TV kind 13, film without a check 4; an entity can have several) |
| Contradictory | n/a | 440 |
| Insufficient | n/a | 638 |
| Incorrect-kind contradictions | 0 detected | 15 category vs kind, 5 TMDB genres vs kind |
| TMDB conflicts | unconfirmed 36, mixed 7, homonyms 73 | unconfirmed 36, mixed 7, homonyms 72, unstable id 1, slot < runtime 10 |
| Canonical ownership doubts (quarantined) | 213 + 4 + 5 pathless, 4 legacy conflicts | same |
| Generic slots | 48 titles rejected; 62 slot-wordings quarantined | same |
| Gate violations | 0 | 0 (including the 3 new gates) |
| Digest | `d8aeca9c…` (2D-2F traces) | `d35e7caf…`, reproduced offline |

**Resources** for 7 trace runs:
- 6.0–10.9 s and 149–202 MB peak RSS each (cap 1.2 GB, pool 2);
- 186–199 commands each, all `find`/`getMore`/`endSessions`, 0 writes, 0 DDL, guard never tripped.

**Production checks:**
- baseline identical before and after (40 collections, 272 indexes, no `content_*`, 16 airing indexes, 0 entity and 0 path references, 11,211 airings);
- `/health` 200 before and after;
- VPS `/tmp` cleaned.

## 9. Tests and CI

| Check | Result |
|---|---|
| Backend lint | clean |
| Backend `npm test` with `TEST_MONGO_URI` | **469: 468 pass, 0 fail, 1 skip** (Redis) |
| Evidence (9 tests) | provenance roots, homonyms via alternative titles, runtime and raw-year checks, TMDB genres for kind, season check, no circular independence, unstable TMDB ids, broadcaster category conflicts, 2D-2F contradictions, levels kept apart, 7 planted gate violations |
| Ingestion (Mongo) | broadcaster evidence in traces (category, slot minutes, max season, 4-digit seasons ignored) |
| Year provenance (2) | flag off: output unchanged; flag on: raw kept across enrichments, absent raw recorded, non-enrichment untouched |
| SSR `ssr-canonical` / `ssr-cache` | 12/12 |
| Existing tests changed | the 2D-2F evidence tests are rewritten for the new categories (title-only works are no longer accepted); no other test changed |

## 10. Quality gates

| Gate | Status |
|---|---|
| Machine-evidence gate (`content-identity evidence`) | **pass**: 0 ownership, cross-kind, episode, circular-independence, unsupported-TMDB, unverified-kind or conflict violations among the 163 |
| Human write gate (`score --verify`, unchanged) | **unmet**: 0 human labels |

**Policy proposal v1 [P], not in force; needs separate written authorisation.**
- **Canary population:** a machine-evidence canary may write only `independently_supported` identities.
- **Prerequisites:**
  - the human gate passes on a sheet drawn from that population (≥ 100 rows, 0 errors in critical fields);
  - **or**, as a weaker alternative the owner may choose, a canary of ≤ 50 films with zero public exposure, with the human sheet run on exactly the written rows within 7 days.
- **Risks of the alternative:** precision unknown when writing (the 163 are machine-checked, not labelled); TMDB metadata errors propagate; a homonym missing from TMDB's top results is undetectable.
- **Mitigations:** writes stay invisible (no public route reads entities); rollback drops three collections.

## 11. Rollout and rollback [P]

| Step | Change | Authorisation | Rollback |
|---|---|---|---|
| Merge this PR | evidence code and CLI; flags untouched, no runtime path | routine (CI green) | revert the commit |
| `EPG_YEAR_PROVENANCE=true` (separate PR) | adds `sourceProvenance.yearProvenance` to enriched programmes from the next sync | **owner** (it changes stored EPG documents) | unset the flag; the fields are inert |
| Write canary | `CONTENT_ENTITIES_ENABLED=true`, `CONTENT_IDENTITY_WRITES=guiatv`, `CONTENT_IDENTITY_MAX_CREATES≤50`, limited to `independently_supported` | **owner**, after §10 | unset the flags, restart, drop the three `content_*` collections |

**Recommended next stage:**
1. The owner authorises `EPG_YEAR_PROVENANCE`, so raw years start to exist.
2. After a week, re-run this replay. The raw-year check adds an independent leg for films.
3. Draw the human sheet from the `independently_supported` set (about 160 rows: smaller than 300, and the population a canary would use).

Persistent identity writes remain **NO-GO**.

## 12. Remaining uncertainties

- **TMDB is the only external identity source.** A work missing from TMDB, or a homonym outside the top results, is undetectable.
- **The independent checks are consistency checks, not identifiers:**
  - a film's runtime fits many slots;
  - season counts only rule works out;
  - no broadcaster sends an external id.
- **Title-only works** (348 machine-supported) have no independent route. They need people, or a broadcaster identifier.
- **The read model's `editorialCategory`** mixes broadcaster and TMDB data. Identity now reads the raw `genre`, but the category itself is unchanged and is used publicly.
- **The rebuild hook** (`runContentIdentity`) does not pass raw years yet. Only shadow tools read them; this must be wired before a write run relies on them.

## 13. Artefacts (`docs/seo/phase-2d2g/`)

| File | Contents |
|---|---|
| `traces-20261013-20261020.tar.gz` | the six days' traces (logger lines removed), including the new broadcaster fields |
| `tmdb-checks-20261020.json` | TMDB lookups, format 2 |
| `verdicts-20261020.jsonl` | every candidate's verdict, provenance and roots |
| `evidence-20261020.json` | 2D-2G gate output |
| `evidence-2d2f-rules-same-traces-20261020.json` | the 2D-2F evaluator on the same traces (529, identical to its report) |
| `baseline-{before,after}.json` | production counts around the run |

**Reproduce:**

```sh
tar xzf traces-20261013-20261020.tar.gz -C /tmp/t
node dist/scripts/content-identity.js evidence /tmp/t/traces-20261020-run1.jsonl /tmp/t/traces-2026101{3,6,7,8,9}.jsonl --tmdb tmdb-checks-20261020.json
```

The output digest is `d35e7caf…`.
