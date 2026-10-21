# Phase 2D-2E: content identity normalisation, episode detection and cross-kind resolution

Branch `feat/identity-normalization-2d2e`, based on PR #37 (`feat/identity-quality-gate-2d2d`, head `14dce35`). Not merged, not deployed. No production write, backfill, index, approval, route or indexable URL. Labels: **[V]** verified in this phase, **[E]** estimate, **[P]** proposal, **[U]** unverified, with the reason.

## 0. Summary

- **Episodes.** EPG titles are now parsed into a work and an installment before they are keyed. "9-1-1 T4 E3 · El futuro" is the work "9-1-1"; "Alerta Cobra T22 Ep09" is "Alerta Cobra". A bare " - " or " : " is never split on the title alone: other evidence must confirm the split. The original title is never changed.
- **Slots.** "Repetición de programas", "Programación local" and the other listed fillers are excluded before matching. Titles that are only an episode marker ("Episodio 770", "T11 - Episodio 6") are excluded too.
- **Cross-kind.** A title seen under two kinds without TMDB evidence that separates them is held for review. It gets no entity and no path. A stored identity is never re-kinded.
- **Measured on the production sample [V], no database:** machine-flagged proposals fall from **31.0% to 5.0%** of the 300-row random sample. The 15 rows still flagged are trailing-number flags on real titles ("Scream 2", "Telediario 2"). The identity of 22.7% of proposed entities changes (95% CI 18.1–27.8%).
- **Full-day production replay (§16, read-only, baseline identical):** proposed entities 2,121 → 1,664; marker/separator flags 692 hits → 4 (real titles); cross-kind twins 14 → 0; canonical collisions 0; TMDB-rejected airings 16.4% → 11.0%. The new-seed review sheet is representative. Fixes from the full-day review are in §17; the assistant's pre-review (not human labels) is in §18.
- **Decision: write mode stays NO-GO** until the replay runs and the human gate passes. **The branch is ready for code review.**

## 1. Baseline [V]

| Check | Result (2026-10-21) |
|---|---|
| PR #37 | open, `mergeStateStatus: CLEAN`, head `14dce35` (unchanged since the 2D-2D report), CI `verify` and `ssr-resilience` green, `live-crawl` skipped |
| This branch | from `14dce35`. PR targets `feat/identity-quality-gate-2d2d`, so its diff holds only 2D-2E. Retarget to `main` once #37 is merged |
| Production access in this phase | read-only `mongosh` on the VPS and reads of the local dev database were both **refused by the auto-mode classifier** ("production reads"). All measurements below use repository artefacts and an empty scratch `mongod` |

## 2. Root-cause analysis [V]

| Symptom (2D-2D) | Cause |
|---|---|
| 657 of 2,121 proposals (31%) look episode-level | `titleIdentityKey` = `buildProgramBrandKey` minus a trailing `_capitulo_N`. The brand key drops `T4`, `E3` and `S1E2` **anywhere** but keeps everything else. "9-1-1 T4 E3 · El futuro" became `9_1_1_el_futuro`, so every titled episode was its own work. `Ep09`, `(171) 7` and the feed's ` · ` separator were not recognised at all. |
| Entity title and slug carry the episode | the group title was the shortest *original* spelling, and the slug was derived from it |
| 16.4% of airing TMDB ids rejected | partly the same cause. `confirmTmdb` compares the catalogue title's key with the airing's key, and an episode key ("boardwalk_empire_21") never equals the catalogue's ("boardwalk_empire") |
| 14 cross-kind splits, 9 with two paths | kind comes from each channel's category. A title key row is `key\|kind\|discriminator`, so a "Series" sighting and an "Entretenimiento" sighting never meet, and each creates an entity. Nothing compared kinds within a run or against stored rows of another kind |
| Slot titles proposed as entities | `GENERIC_TITLE_KEYS` held bare category words only |
| "Episodio 770" → `/programas/episodio-770` | the old marker regex needed a preceding title word (`_episodio_770`), so a title that is only a marker kept its key |

## 3. Domain model [V]

| Concept | What it is | In this phase |
|---|---|---|
| **Content work** | a film, series or programme. One `content_entities` row (2D-1) | the only thing that gets an entity, a title key and a path |
| **Episode** | an installment of a work: season/episode numbers, episode title | parsed (`parseEpgTitle`), reported in traces, **never** an entity, slug or route. Not stored: the parser is deterministic, so episode data can be derived again from the airing's original title and sub-title whenever an episode feature needs it |
| **Broadcast airing** | one channel/time slot (`tv_read_airings`) | unchanged. Keeps its original title and sub-title |
| **Generic broadcast slot** | schedule text with no work behind it | excluded before matching: no candidate, no review row, no path |
| **Unknown** | not enough evidence for a work | `unknown_kind`, `title_uncertain`: reported, not stored, re-evaluated each run |

How this relates to the earlier contracts:
- **2D-1 schemas:** unchanged. There are no new collections, fields, indexes or states. `manual_review` rows with reason `cross_kind_conflict` use the existing review queue.
- **2D-2 ingestion:** the *meaning* of the title key changes from "brand key of the spelling" to "key of the work". This is safe now only because production holds **no** `content_*` rows (2D-1/2D-2 deploy checks, 2D-2D §1). After the first write it would be a migration.
- **2C path rules:** unchanged. §F.2 already dropped season/episode markers from slugs; episode subtitles are now dropped too. The year-only disambiguation, the absence of a counter fallback, and the historic-owner and inventory checks are all untouched. Historic keys use the same `titleIdentityKey`, so both sides of the ownership comparison change together.

## 4. Normalisation algorithm [V]

`parseEpgTitle(title, subtitle?)` (`contentIdentity.ts`) returns `originalTitle`, `proposedWorkTitle`, `normalizedWorkKey`, `episodeTitle`, `seasonNumber`, `episodeNumber`, `evidenceSource` (`title` / `title_marker` / `title_separator` / `xmltv_subtitle`), `confidence` (`high` / `medium` / `low`) and `resolutionState` (`work` / `episode` / `uncertain` / `generic` / `no_work` / `unkeyable`).

The parser runs these steps in order. Each step only reads evidence; nothing is guessed.
1. **XMLTV `sub-title`** (now passed through from `program.subtitle`). If the title ends with it after a separator, cut it off: episode, `high`. Otherwise it is recorded as the episode title only.
2. **Feed separator ` · `** (the provider's title·episode join, seen in every 2D-2D example): split, `medium`. A part that is entirely in parentheses ("· (The dog lover)") is treated as an original title, not an episode name.
3. **First season/episode marker that has title text before it**, as a standalone word: `T4 E3`, `T4E3`, `S04E03`, `T22 Ep09`, `4x03` (two-digit episode, so "4x4" stays a title), `Temporada 4 [Episodio 3]`, season-only `T1`, `Episodio/Episodi/Episode/Capítulo/Cap./Ep. N`, `Chapter N`: `high`. Text after the marker becomes the episode title.
4. **Trailing parenthesised episode number** "(76) 12" (1–3 digits; four digits are a year): `medium`.
5. **A title that is only markers** ("Episodio 770", "T11 - Episodio 6", "S01E02"): `no_work`.
6. **Repeated episode name** ("UFO Witness: Órbitas e insectoides T2 E2 · Órbitas e insectoides"): a colon segment is dropped only when the episode part repeats it. A colon on its own is part of the title ("Agatha Christie: Poirot", "Peter Rabbit 2: A la fuga").
7. **Slots and containers:** `generic`.
8. **A bare ` - ` / ` – ` / ` : `** with nothing above: `uncertain`, with the split it would give.

Ingestion settles `uncertain` titles with evidence from the whole day. Every rule reads sets built from the whole day, never an earlier decision, so the result is order-independent:
- the **whole text is the work** (`title_part`) when TMDB confirms the whole title, a stored identity has its key, or the kind is film ("Misión imposible - Fallout" stays apart from "Misión imposible");
- it is an **episode of the left part** (`episode:corroborated`) when TMDB, a stored identity, or another airing of the same day with a plain or explicitly marked title confirms that left part ("Zapeando - Especial Halloween" next to "Zapeando");
- **otherwise it is held** (`title_uncertain`): unresolved, not stored, retried next run. Example: "Los conciertos de Radio 3 - Tako".

Deliberately **not** split: `parte N` (a film part: "Dune: Parte dos"), standalone `E3`, a leading `T2` ("T2 Trainspotting"; the identity key now keeps a leading `T2`/`E3` that the brand key would drop), and `X: Y` without a space before the colon.

**XMLTV `episode-num`** is not parsed by `XMLParser`, and no airing stores it, so it cannot be evidence yet. [P] Parse it in a later phase if a feed sends it. The title markers above carry the same numbers today.

## 5. Generic broadcast slots [V]

Added as exact work keys: `repeticion_de_programas`, `programacion_local`, `informacion_de_programacion`, `proximamente`, `espacio_promocional`, `programacion_especial`, `avance_informativo`. These join the existing bare slot words (`cine`, `pelicula`, `fin_de_emision`, …) and the container and rating-line rules.
- **Exact key only.** "Programación local de Navidad en Lugo", "Próximamente en cines", "Noticias de un secuestro" and "Cine de barrio" stay works (tests).
- **Effect.** Excluded before candidates, so a slot never claims a path, enters the queue or becomes a page. Traces still list excluded titles (decision `rejected`), so slots can be sampled.
- **Open (remaining cases, §12).** "Pause · Elche 7 TV" now proposes `/programas/pause`, and "+ Que Cine" is still a candidate. There is no production evidence of how often they occur, so they are left to the human review (`error_category=generic_slot`).

## 6. Cross-kind identity resolution [V]

The evidence priority is applied as follows:
1. **Stored identities first.** An exact stored row matches or holds as before. A same-kind binding still binds. A verified or candidate row's kind is never rewritten.
2. **A confirmed TMDB work stands.** It is held only when the same TMDB work appears under two kinds, or a stored entity of another kind holds the title without a different TMDB id.
3–4. **Structured metadata and history.** The catalogue (TMDB) and stored rows are the structured and historical evidence used. `media_catalog` carries no genres, so there is no finer series/show signal yet.
5–6. **Category and title-derived kind are weak.** A title-only candidate seen under another known kind in the same run (by key) is held. A title-only candidate whose key a stored entity of another kind owns goes to review with that entity as evidence.

Held candidates become `manual_review` rows with reason `cross_kind_conflict` (in write mode), with no entity and no path. The next day's single-channel sighting finds the row and stays `held`, so no twin appears later.

**The 14 split groups of 2D-2D**, re-derived from the 25 of their 28 entities that are in the 2D-2D sample (TMDB evidence as recorded there):

| Work | 2D-2D | 2D-2E |
|---|---|---|
| Alma en suplicio | film (TMDB movie 3309) + title-only series, 2 paths | film stands, series held |
| La revuelta | series (TMDB tv 270462) + show | series stands, show held |
| Mésnit | series (TMDB tv 270838) + show | series stands, show held |
| La gran belleza | film + title-only series, 2 paths | series held; film stands if its TMDB id is confirmed, otherwise held [U]: film side not in the sample |
| Cómicos nuestros | film + show (show has the path) | show held; film as above [U] |
| Cara a cara, Caso cerrado, Cuando los muertos hablan, Diagnóstico (TMDB unconfirmed), Escápate de viaje, La aventura del saber, La Renaixença, Limpia y ordena, Wild Ibex | title-only on both sides, up to 2 paths | both held |

Result: **0 of 14 groups keep two entities.** 3–5 groups resolve to the TMDB-backed work and the other 9–11 go to review. Holding both sides of a title-only split is the deliberate false negative: works such as "Caso cerrado" wait for a person instead of becoming two.

## 7. Canonical ownership safety [V]

- These are unchanged in code and still pass their tests: the append-only slug registry, sticky verified mappings, TMDB uniqueness (entity first for TMDB works), the historic-owner and inventory checks, remake disambiguation (years more than one apart), no counter suffix, no automatic re-pointing of a path, `mayBeIndexable`, and the public routes, sitemaps and SSR. The diff touches 7 backend files: domain identity, ingestion, audit, CLI and their tests.
- **No canonical collisions:** none in either replay (`canonicalCollisions: 0`). No held candidate has a path (Mongo test).
- **False merges are guarded by tests (§10):** film vs series of one title, remakes, similar shows, an anthology, a one-off documentary with an episode-like word, conflicting TMDB, digits and punctuation, accents and non-Latin titles.
- **Ceiling:** `confident` keys come from one day. A work that only ever airs as "X - Y" stays `title_uncertain` until a plain sighting, a TMDB match or a review provides the evidence.

## 8. Before/after measurements

### 8.1 Production sample projection [V] (`phase-2d2e/sample-projection-20261020.json`)

The 2D-2D review sheet (production 20261020, seed `20261020`, 460 rows) was re-parsed with the 2D-2E rules. **Before** = the 2D-2D decision, **after** = what the 2D-2E parser makes of the same spellings. No database was used. The rules that need the whole day are shown as "needs the day".

| 300-row simple random sample of the 2,121 auto-creations | n | % (exact 95% CI) |
|---|---|---|
| Identity changes | 68 | 22.7% (18.1–27.8) |
| · normalised to the work ("Big Bang T3 E20 · …" → Big Bang) | 48 | 16.0% (12.0–20.6) |
| · uncertain, settled by the day (corroborate, film title or hold) | 18 | 6.0% (3.6–9.3) |
| · removed: slot / episode-only | 1 / 1 | 0.7% (0.1–2.4) |
| Same key, episode spellings now recognised | 23 | 7.7% |
| Unchanged | 209 | 69.7% |
| **Machine-flagged, 2D-2D flags on stored title and path** | **93 → 15** | **31.0% → 5.0% (2.8–8.1)** |

All 15 remaining flags are `trailing_number` on real titles: "Scream 2", "Los mercenarios 2", "Telediario 2", "Mañaneros 360", "Cleo de 5 a 7", "Los pequeños asesinatos de Agatha Christie: años 50" and similar. One case is doubtful: "Amanda y Alan: reformas a la italiana: Amanda y Alan: reformas a la italiana 1" (§12). The sample shows consolidation only as a lower bound (6 within 300 rows). The full-day count needs §8.3.

### 8.2 Isolated scratch replay [V] (`phase-2d2e/replay-scratch-sample-20261020-diff.json`)

The replay ran on an empty `mongod` 8.0.29 (`127.0.0.1:27118`, database `guiatv_replay_2d2e`), so there was no historic or catalogue data. It contains 521 airings: every spelling in the 2D-2D sample, with categories rebuilt from each candidate's kind and no TMDB. Both builds ran under the read-only guard: 9 read commands each, 0 writes. This tests the pipeline and the cross-candidate rules on real titles. It is **not** a production population.

| Metric | 2D-2D build (`14dce35`) | 2D-2E build |
|---|---|---|
| Candidates / proposed entities | 458 / 427 | 424 / 352 |
| Machine-flagged proposals | 116 | 20 (19 trailing number, 1 "+ Que Cine") |
| Duplicate-slug groups / cross-kind splits / with two paths | 15 / 15 / 11 | **0 / 0 / 0** |
| Canonical collisions | 0 | 0 |
| Review queue | 4 `several_entities` | 30 `cross_kind_conflict` (15 works × 2 kinds) |
| Unresolved | 27 unknown kind | 31 unknown kind, 11 `title_uncertain` |
| Excluded | — | 6 episode-only, 1 slot |
| Unknown-kind rate / pathless rate | 6.8% / 21.3% | 7.3% / 24.4% (no historic evidence in scratch, so not comparable to production) |

Fate of the 427 old proposals:
- 298 kept;
- 45 consolidated into a shared work;
- 35 renamed to their work;
- 31 held as cross-kind (8 of them also unknown-kind);
- 11 held as `title_uncertain`;
- 7 removed (6 episode-only, 1 slot).

**A lower entity count is not the measure.** The table above shows where each proposal went, and every held one is listed by title in the diff file.

### 8.3 Full-day production replay: run later, results in §16

The auto-mode classifier refused both production reads and local dev-database reads. Before/after on the same final day (`20261020`, final since its 10-21 rebuild) takes two guarded runs on the VPS, the same way as 2D-2D §4:

```sh
# candidate builds copied to /tmp/guiatv-2d2e/{before,after} (14dce35 and this branch), node_modules linked from the release
for v in before after; do (cd /tmp/guiatv-2d2e/$v/apps/backend && \
  CONTENT_IDENTITY_MAX_CREATES=100000 systemd-run --scope -p MemoryMax=1200M --nice=10 \
  timeout 600 node --max-old-space-size=1024 /tmp/guiatv-2d2e/trace-dump.js 20261020 > /tmp/guiatv-2d2e/traces-$v.jsonl); done
node docs/seo/phase-2d2e/diff.js traces-before.jsonl traces-after.jsonl > docs/seo/phase-2d2e/diff-20261020.json
# new review sheet, NEW seed (the 2D-2D sheet stays as it is)
CONTENT_IDENTITY_MAX_CREATES=100000 node dist/scripts/content-identity.js shadow 20261020 --sample 25 --precision-sample 300 --seed 2d2e-20261020 --out <dir>
```

**Superseded by the runbook in §15** (`phase-2d2e/run-replay.sh`), which wraps these commands with every safeguard.

Expected cost, from the 2D-2D runs: about 200 reads, about 185 MB, about 10 s per run. `diff.js` reports:
- candidates and creations by kind;
- machine-flagged (episode-level) proposals;
- duplicate and cross-kind groups;
- unknown-kind and pathless rates;
- TMDB evidence;
- the review queue and unresolved reasons;
- canonical collisions;
- each old proposal's fate (kept / renamed / consolidated / removed / held).

## 9. Quality and statistical validation

**Review dataset.** The 2D-2D sheet and sample are unchanged (`phase-2d2d/`). The new-seed sheet (`2d2e-20261020`) is generated by the command in §8.3, from the 2D-2E population of the same day. The strata are:
- `auto_create`: 300-row simple random sample;
- 25 rows per class, including the new strata `episode_normalized`, `title_uncertain`, `cross_kind_conflict` and `generic_slot`;
- `tmdb_confirmed` / `tmdb_rejected` and `historic_ownership`, as before.

New machine columns: `work_title`, `title_evidence` and `cross_kind`. `epg_title` now holds the original spelling.

**Reviewer workflow** (`scoreReview`, `compareReviews`, CLI `score <sheet> --verify <second>`):
1. **Primary labels.** All 300 `auto_create` rows get `identity_ok` y/n, plus `kind_ok`, `duplicate_of`, `tmdb_ok`, `path_ok` and `critical`. A `?` blocks the gate.
2. **Error categories.** Every `identity_ok=n` needs `error_category`: `episode_as_work`, `generic_slot`, `cross_kind_split`, `false_merge`, `duplicate`, `wrong_kind`, `wrong_tmdb`, `wrong_path`, `not_a_work` or `other`. A wrong row without one blocks the gate.
3. **Independent verification.** A second person labels a copy of at least 50 `auto_create` rows without seeing the first labels. A row labelled by the same person blocks the gate.
4. **Disagreements.** Overlapping rows whose `identity_ok`, `kind_ok`, `path_ok` or `critical` labels differ are listed. They are settled by agreement: the primary row takes the agreed label, with a note naming the field ("adjudicated identity_ok: …"). Settled labels still count as disagreements in the reported agreement and Cohen's kappa.
5. **Gate** (unchanged where 2D-2D defined it): 300 rows labelled, observed identity precision ≥ 98% with the exact one-sided lower bound reported, 0 critical ownership violations, no unsigned labels. Added in 2D-2E: verification ≥ 50 rows, 0 open disagreements, every error categorised. Exit 0 only on a pass.
6. **Machine output never counts:** unlabelled rows are unreviewed (test), and projections and flags are not labels.

**Human-reviewed precision: none. No row has a human label.** The power table in 2D-2D §7 still applies: a pass needs at most 6 errors in 300, and even 300/300 supports only a 99.0% one-sided bound.

## 10. Tests and CI [V]

| Check | Result |
|---|---|
| Backend `tsc` lint | pass |
| Backend `npm test` with `TEST_MONGO_URI` (scratch `mongod` 8.0.29) | **454: 453 pass, 0 fail, 1 skip** (Redis, as before). It was 444 in 2D-2D |
| Episode parser | all formats in §4, real production spellings, XMLTV sub-title, uncertain separators, colon rule, slots and their legitimate look-alikes, episode-only and non-Latin titles |
| Regressions (master prompt §7) | film/series sharing a title, a remake, two similar shows, a series with many episode titles, an anthology, a one-off documentary with an episode-like word, conflicting TMDB, digits and punctuation, accented and non-Latin titles |
| Property tests (seeded, no new dependency) | 2,000 work + marker (+ episode name) cases parse back to the work and numbers; 5,000 random strings: never throws, keeps the original, deterministic, keys `[a-z0-9_]{≤120}`, an episode's work title has the same key, and no separator without a marker ever makes an episode |
| Cross-kind (pure and Mongo) | stored film vs title-only series → review with the film as evidence; two different TMDB works may coexist; a stored title-only show holds a TMDB series; a same-kind binding still matches; in-run splits (title-only and same TMDB under two kinds) held, stored as `manual_review` without entity or path, and still held next day; a stored kind is never rewritten |
| Determinism / order independence | same traces for reversed input (Mongo test); seeded samples (existing) |
| Concurrency, crash recovery, canonical ownership, historic owners, pathless repair | existing Mongo cases pass unchanged |
| Reviewer and read-only guard | existing cases pass; new: verification, adjudication, kappa by hand, self-verification refused, uncategorised errors refused |
| `ssr-canonical.test.mjs` / `ssr-cache.test.mjs` | 8/8, 4/4 |
| Existing tests changed | 3 expectations, none weakened: the trace count now excludes the new `rejected` traces and asserts them explicitly; the pathless trace is titled "La Promesa" instead of "La Promesa T1 E929"; the 98% pass case now also supplies a verifier and error categories |
| Not run locally | Karma, `ng build --ssr`, the crawl: no frontend, SSR or infra file changed. CI runs them on the PR |

## 11. Production safety analysis [V]

- **Nothing runs in production by default.** Identity code runs only under `CONTENT_IDENTITY_*` flags, and all of them are unset in `/etc/guiatv/api.env` (2D-2D §1). A deploy of this code would change no stored data, collection, index or response.
- **With the shadow flag**, the run makes the same reads plus key lookups for uncertain splits. These are folded into the existing single `listByKeys` call (still one read; Mongo test).
- **No public surface changes:** no route, sitemap, canonical, SSR, redirect or indexability rule.
- **The key-semantics change is safe only before the first identity write.** Production holds no `content_*` rows. After the first write, any further key change needs a migration plan.
- **Review queue growth [E]:** about 2 rows per cross-kind work per day, about 20–30 per day at the 2D-2D split rate. Episode consolidation may surface more series/show pairs, and only §8.3 can measure that.

## 12. Remaining ambiguous cases

- **Episode-level titles with no marker**, e.g. "Un día en la Historia de España: 20 de octubre de 1982" and "El punto sobre la historia: El Retiro" (colon form). Each stays its own work: a false negative, left to review.
- **Doubled feed text with a trailing number:** "Amanda y Alan: reformas a la italiana: Amanda y Alan: reformas a la italiana 1".
- **Slot-like titles not on the list:** "Pause · Elche 7 TV" (→ "Pause") and "+ Que Cine".
- **Concert and anthology spellings** ("Los conciertos de Radio 3 - X", "Handel : Tamerlano - …"): held as `title_uncertain` unless the plain work airs the same day.
- **Kind of a TMDB TV work** (series vs show) still comes from the channel category. "La revuelta" (a talk show) would be a series. Kind accuracy is a human label (`kind_ok`).
- **Cross-kind holds that are the same work** (most title-only series/show pairs) need a reviewer decision each. [P] A later phase could take the kind from the majority of a work's categories over a window (2D-2D option), once the human review measures how often category disagreement means the same work.
- **TMDB enrichment bug** (2D-2 §A): unchanged. Episode keys no longer block confirmation, so the rejected share should fall. That is unmeasured until §8.3 runs.

## 13. GO / NO-GO

| Decision | Status |
|---|---|
| Code review of this PR | **GO**: tests green, read-only by construction, no public change |
| Merging | owner's decision, after PR #37. This PR is based on #37 and is retargeted after it |
| Persistent identity writes (canary in 2D-2D §14) | **NO-GO** until: (1) the §8.3 replay runs on production `20261020`, with episode-level flags ≤ 2% after excluding real-title trailing numbers, 0 cross-kind splits with two paths and 0 canonical collisions; (2) the owner labels the new-seed sheet, a second reviewer verifies at least 50 rows, and `score --verify` exits 0 |

The definition of done is met on the evidence available here: episode duplication is reduced on the production sample (31% → 5% flagged, the rest real titles), and every cross-kind split is either resolved by TMDB or held. It still needs the production replay to confirm it at full-day scale.

## 14. Artefacts

| File | Contents |
|---|---|
| `docs/seo/phase-2d2e/project-sample.js` | no-database projection of a review sheet under the 2D-2E rules |
| `docs/seo/phase-2d2e/sample-projection-20261020.json` | the projection of the 2D-2D production sheet (§8.1), every row |
| `docs/seo/phase-2d2e/trace-dump.js` | read-only full trace dump of one day, for either build (guard first) |
| `docs/seo/phase-2d2e/diff.js` | machine-readable before/after diff of two dumps |
| `docs/seo/phase-2d2e/replay-scratch-sample-20261020-diff.json` | scratch replay diff (§8.2), every old proposal's fate |
| `docs/seo/phase-2d2e/run-replay.sh` | owner-run full-day replay: baseline before/after, both trace dumps, new-seed sheet (§15) |
| `docs/seo/phase-2d2e/baseline.js` | read-only `mongosh` counts: collections, indexes, `content_*`, airing indexes, entity/path refs |
| `docs/seo/phase-2d2e/check-sample.js` | representativeness of a sheet's auto-create sample (exit 2 if not) |
| `docs/seo/phase-2d2d/*` | unchanged: the 2D-2D sheet, sample and flags, kept for comparison |

## 15. Final read-only replay: owner-run (2026-10-21, second session)

**Status: run, 2026-10-21 13:18–13:19 UTC, results in §16.** The first attempt was refused by the auto-mode classifier. The owner then authorised the run explicitly, and the bundle below was copied and run by Claude. `REL=/var/www/guiatv` was used because the release resolves `node_modules` from `/var/www/guiatv/node_modules`. Afterwards `/tmp/guiatv-2d2e*` was removed from the VPS.

**PR status [V]:**
- **#37:** open, CLEAN, CI `verify` and `ssr-resilience` green. Safety review: it changes only `ContentIdentity*`, `scripts/content-identity.ts`, `scripts/readOnlyGuard.ts`, tests and docs. It adds no route, controller, HTTP surface, environment default or index. The only write and DDL tokens are the guard's deny-list and its own test. **Ready to merge** (owner's decision; merging deploys, and every flag stays unset).
- **#38:** open, based on #37's branch. CI green on `1d0efd8` (`verify` 4m13s, `ssr-resilience`). After #37 merges: `gh pr edit 38 --base main`, check that the diff lists only the 2D-2E files, and re-run CI.

**The runbook (`run-replay.sh`), checked by a dry run [V].** The exact script was run locally against the scratch `mongod` with the two builds below. Each step and its safeguard:
- **Flags:** every `CONTENT_*` variable is removed from the process environment. The dry run's env file set `CONTENT_IDENTITY_SHADOW=true` to check this.
- **Connections:** pool of 2, minimum 0.
- **Resources:** each node run gets `systemd-run --scope -p MemoryMax=1200M --nice=10`, `timeout 600` and `--max-old-space-size=1024`.
- **Read-only guard** (`installReadOnlyGuard`, first in every process): mongoose `autoIndex` and `autoCreate` off, command monitoring forced on, exit 97 before any write, DDL or `$out`/`$merge` is sent.
- **Order:**
  1. `baseline.js` before the runs;
  2. API `/health` probe;
  3. two trace dumps (2D-2D and 2D-2E builds);
  4. new-seed sheet (`--seed 2d2e-20261020`, 300 + 25 per class);
  5. `/health` probe again;
  6. `baseline.js` after the runs, compared field by field (anything other than `identical` exits 3);
  7. guard trip check.
- **Untouched:** no service, release, configuration or file outside `/tmp/guiatv-2d2e`, and no restart.
- **Dry-run result:** 9 read commands per run, 0 writes, baseline identical, guard not tripped, sheet written. `check-sample.js` reported the sample representative (kind and path shares inside the exact 95% CIs).

**Bundle:** `guiatv-2d2e-bundle.tgz`, 1.9 MB, sha256 `0e6d81f4cf468521e3a75cd890b912fad4b25c88a3d5941415aa2fd0ef6c11d3`. It contains:
- `before/apps/backend/dist`, built from `14dce35` (2D-2D);
- `after/apps/backend/dist`, built from `1d0efd8` (2D-2E);
- `run-replay.sh`, `trace-dump.js` and `baseline.js`.

Neither build adds a dependency, so the script links the release's `node_modules`.

**Owner commands:**

```sh
scp guiatv-2d2e-bundle.tgz contabo:/tmp/ && ssh contabo 'cd /tmp && sha256sum guiatv-2d2e-bundle.tgz && tar xzf guiatv-2d2e-bundle.tgz && bash /tmp/guiatv-2d2e/run-replay.sh'
scp -r contabo:/tmp/guiatv-2d2e/'{traces-before.jsonl,traces-after.jsonl,sheet,baseline-before.json,baseline-after.json,shadow-report.json}' /tmp/guiatv-2d2e-out/
# locally, in apps/backend after npm run build:
node ../../docs/seo/phase-2d2e/diff.js /tmp/guiatv-2d2e-out/traces-before.jsonl /tmp/guiatv-2d2e-out/traces-after.jsonl > ../../docs/seo/phase-2d2e/diff-20261020.json
node ../../docs/seo/phase-2d2e/check-sample.js /tmp/guiatv-2d2e-out/sheet/identity-20261020-2d2e-20261020-sample.json /tmp/guiatv-2d2e-out/sheet/identity-20261020-2d2e-20261020-review.csv
cp /tmp/guiatv-2d2e-out/sheet/* ../../docs/seo/phase-2d2e/
ssh contabo 'rm -r /tmp/guiatv-2d2e /tmp/guiatv-2d2e-bundle.tgz'   # afterwards
```

**What `diff-20261020.json` answers:**

| Question | Field |
|---|---|
| Candidate titles | `before/after.candidates` |
| Proposed entities | `.created`, `.createdByKind` |
| Episode-level proposals | `.machineFlagged`, `.machineFlags` |
| Cross-kind duplicates | `.crossKindSplits`, `.crossKindSplitsWithTwoPaths` |
| Unresolved / manual review | `.unresolved`, `.reviewQueue` |
| Excluded slots and episode-only titles | `.excluded` |
| TMDB confirmed/rejected | `.tmdbAirings`, `.tmdbEvidence` |
| Paths proposed, refused, pathless; historic owner | `.paths` |
| Canonical ownership conflicts | `.canonicalCollisions` (two proposals, one path) and `.paths.ownershipConflictsRefused` (legacy owner, refused) |
| Decision differences | `fates` and `decisions` (each old proposal) |
| Potential false merges | `consolidations`: every new entity that absorbs several old proposals, with their titles. Each must be checked by a person; machine output is not a label |

**Human review**, after the sheet is copied into the repo:
1. Label all 300 `auto_create` rows in `identity-20261020-2d2e-20261020-review.csv` (§9 columns; `error_category` on every `n`).
2. Label the high-risk strata, including `episode_normalized`, `title_uncertain`, `cross_kind_conflict` and `generic_slot`.
3. A second person labels a copy of at least 50 `auto_create` rows without seeing the first labels.
4. Settle disagreements with notes such as "adjudicated identity_ok: …".
5. Run `node dist/scripts/content-identity.js score <primary.csv> --verify <second.csv>`. Exit 0 means the gate passed.

**Decision: production writes NO-GO.** No full-day metrics have been measured yet, and no human-labelled sample exists. The write canary is not to be started.

## 16. Full-day production results, `20261020` [V]

**Final run, 2026-10-21 ~13:50 UTC.** The baseline is 2D-2D build `14dce35`; the candidate is the final 2D-2E build (this branch, including the §17 fixes). Production day `20261020` has 11,211 airings and has been final since its 10-21 rebuild. The output files, all in `phase-2d2e/`:
- `diff-20261020.json`: the diff;
- `baseline-20261021-{before,after}.json`: the baselines;
- `identity-20261020-2d2e-20261020-{review.csv,sample.json}`: the new review sheet.

**No production mutation (four runs, the same each time):**

| Check | Result |
|---|---|
| Commands | 2D-2D 201, 2D-2E 199, sheet 199; all `find`/`getMore`/`endSessions`. Guard never tripped |
| Resources | 7–12 s and ~181 MB peak RSS per run (cap 1.2 GB, pool 2) |
| Baseline before = after | **identical**: 40 collections, 272 indexes, no `content_*`, 16 `tv_read_airings` indexes, 0 `program.entityId`, 0 `program.canonicalPath`, 11,211 airings. No mongod restart |
| Flags and services | every `CONTENT_*` removed from the environment, none in `api.env`. API `/health` 200 before and after, nothing restarted |
| VPS left clean | `/tmp/guiatv-2d2e*` removed after each run |

One extra bounded read (`find` with a projection, limit 10) fetched the XMLTV sub-titles of three titles while diagnosing a §17 finding.

**Before / after, same day:**

| Metric | 2D-2D | 2D-2E |
|---|---|---|
| Candidate titles (identity contexts) | 3,839 | 3,189 |
| Proposed entities (show / series / movie) | 2,121 (1,313 / 487 / 321) | **1,664** (1,099 / 251 / 314) |
| Machine-flagged proposals, any flag | 647 (30.5%) | **134 (8.1%)** |
| · marker / separator / episode word / `(N)` hits | 692 | **4**: real titles with " - ", e.g. "Royals - La Casa Danesa" |
| · trailing number | 208 | 129, real titles ("Antena 3 Noticias 2", "Scream 2", "Cleo de 5 a 7") |
| · slot word | 6 | 1 ("Cierre de Wall Street", a real programme) |
| Duplicate-slug groups / cross-kind splits / with two paths | 14 / 14 / 9 | **0 / 0 / 0** |
| Canonical collisions | 0 | **0** |
| Excluded airings: slot / episode-only / unkeyable / sport | 34 / – / 39 / 1,370 | **108 / 45** / 36 / 1,370 |
| Title evidence (airings) | – | work 9,027; marker 1,508; ` · ` 74; corroborated 159; film title 2; uncertain 252 |
| Unresolved: unknown kind / title uncertain | 1,708 / – | 1,335 / 119 |
| Review queue | 4 `several_entities`, 1 `kind_conflict` | 29 `cross_kind_conflict` |
| Airing TMDB ids confirmed / rejected | 820 / 161 (16.4%) | 821 / **101 (11.0%)** |
| Candidates with unconfirmed TMDB | 84 | 41 |
| Paths proposed / to verified historic owner | 1,908 / 1,430 | 1,440 / 1,278 |
| Pathless | 213 (10.0%) | 224 (13.5%): `historic_unverified` 213, `historic_conflict` 4, `historic_ambiguous` 5, `unsupported_slug` 2 |
| Paths refused because another legacy work owns them | 22 | 19 (never allocated) |

**Fate of the 2,121 old proposals:**

| Fate | Count |
|---|---|
| Kept | 1,522 |
| Consolidated (92 new entities) | 282 |
| Renamed to their work | 166 |
| Held `cross_kind_conflict` | 74 |
| Held `title_uncertain` | 45 |
| Removed: episode-only | 20 |
| Removed: slot | 11 |
| Removed: unkeyable | 1 |

**Cross-kind, all 15 works:**
- **Resolved to the TMDB work, title-only twin held:** Alma en suplicio, La gran belleza, La revuelta, Mésnit, Caso abierto.
- **Held on both sides:** Cara a cara, Caso cerrado, Cómicos nuestros, Cuando los muertos hablan, Diagnóstico, Escápate de viaje, La aventura del saber, La Renaixença, Limpia y ordena, Los conciertos de Radio 3, Wild Ibex, Wonderblocks.
- **0 of 92 consolidations mix kinds.**

**Possible false merges:** every consolidation is listed in `diff-20261020.json` → `consolidations`. The ones that came through a corroborated weak separator were all checked: Henry Danger, Grimm, and three regional news editions. Each is one programme.

**New review sheet:** `phase-2d2e/identity-20261020-2d2e-20261020-review.csv`, seed `2d2e-20261020`, label columns empty. It contains:
- 300 `auto_create` rows, a simple random sample of 1,664 (18.0%);
- 25 rows per class, including the new `episode_normalized`, `title_uncertain`, `cross_kind_conflict` and `generic_slot`.

**Representativeness** (`check-sample.js`, exit 0): every share lies inside its exact 95% interval.

| Share | Sample | Population | 95% CI |
|---|---|---|---|
| show | 65.3% | 66.1% | 59.7–70.7 |
| series | 13.0% | 15.1% | 9.4–17.3 |
| movie | 21.7% | 18.9% | 17.1–26.8 |
| title-only | 82.0% | 82.1% | 77.2–86.2 |
| TMDB | 18.0% | 17.9% | 13.8–22.8 |
| with a path | 86.0% | 86.5% | 81.6–89.7 |

`score` on the unlabelled sheet exits 2. Blockers: 0 of 300 labels, no precision, no verification.

## 17. Fixes from reviewing the full day and the sample [V]

The first full-day run (on `1d0efd8`) and a review of its 300 sampled rows found these failure modes. Each was fixed with a test and checked with a new read-only full-day run.

| Finding (production examples) | Fix |
|---|---|
| The XMLTV sub-title is usually a metadata line ("2013 \| TP \| ★6.0/10"). The parser took it as the episode name, which disabled the repeated-name rule. Result: "La huella del crimen: El crimen de Traspinedo", "León: Capítulo dos: …" as works | metadata sub-titles (a `\|`, a `★`, or a bare year) are ignored; the repetition check uses the in-title episode name |
| "Así se hace (MAX): Vajillas /Tanques… T12 · Vajillas, frenos…": the episode list is repeated in other words, giving 7 entities in one day | the colon tail is dropped when it shares ≥ 2 words and ≥ 50% of its words with the episode name. "Ley y Orden: Crimen organizado · Crimen en el puerto" (1 shared word) is kept |
| "T2026 E4804", "T2020": 4-digit seasons | seasons `19xx`/`20xx` accepted |
| "Episodios 8-9", "T3: Episodios 5-7" | plural forms and ranges |
| "Amanda y Alan: …: Amanda y Alan: … 1": feed doubling | an exact `X: X [N]` repetition is X |
| "Countryside Escape E13", "Arirang News 12:00 E1" | a trailing standalone `E<n>`; a leading "E3 Noticies" is kept |
| "NOTÍCIES Vespre (R)", "News Generation [r]/[l]", "Dexter (Teleserie)": two slugs for one programme | rerun, live and format tags removed before keying |
| Slots: "Avance <programme>", "DOC", "DOCUMENTAL", "Entrevista", "Redifusión", "Película Clásica", "Dibujos Animados", "+ Que Cine" | exact slot keys, plus an `avance_` promo prefix. "Avances de la ciencia", "Documentales de La 2" and "Doctor Who" stay works (tests) |

Effect of the fixes on the full day:
- entities 1,694 → 1,664;
- excluded slot airings 63 → 108;
- marker/separator hits 3 → 4 (real titles);
- TMDB rejections 106 → 101;
- other metrics unchanged.

Tests: backend **454: 453 pass, 0 fail, 1 skip**; lint clean. The 2,000 + 5,000 seeded property cases still hold; the "no marker, no episode" oracle now includes the trailing `E<n>` marker.

## 18. Machine pre-review of the 300-row sample (**not** human labels)

The assistant reviewed all 300 `auto_create` rows of the final sheet and all 145 high-risk rows. The result is in `phase-2d2e/assistant-prereview-20261020.csv`, in separate `assistant_*` columns. The review sheet's label columns stay empty, and `score` neither reads that file nor accepts an automation name as a reviewer.

| Assistant judgement | Result |
|---|---|
| Identity: exactly one work, not an episode, slot or merge | 300 / 300. Exact one-sided 95% lower bound 99.0%, **if** these judgements were right |
| Kind | 298 / 300: "Power Rangers Fuerza del tiempo" is a series, not a show; "Viajeros Cuatro" is a show, not a film |
| Duplicates | 1: "Els millers curtsFilmets", a feed typo of "Els millors curts. Filmets" |
| Borderline, for the human | news editions named as programmes ("Antena 3 Noticias 2", "Castilla-La Mancha a las 2/3"), "Météo", "Bordertown" (TMDB tv 554 may be the wrong series), "Scream 2" (EPG year 2000) |
| High-risk strata | the 20 slots are all slots; the 25 cross-kind rows all held, or bound to their TMDB work; the 25 uncertain rows are recipe, concert, route and news-edition subtitles held on purpose; normalised episodes are correct |

This is a consistency check, not the gate. The gate (§9) still needs a named person's labels on all 300 rows and an independent second reviewer on at least 50.

**Decision.** Episode-level and cross-kind duplication is resolved on the full production day: 692 marker/separator hits → 4 real titles, 14 cross-kind twins → 0, 0 collisions, and a baseline that is identical every time. **Production writes remain NO-GO** until human labels pass the gate. The write canary is not started.

## 19. Integration status (2026-10-21, ~14:45 UTC) [V]

- **PR #37 merged** (squash `bf7d047`, head `14dce35`, CI `verify` + `ssr-resilience` green). Auto-deploy run 39618914038 succeeded: release `20261021164208` serves `bf7d047`; API `/health` 200, home 200, both services active; no `CONTENT_*` variable in `api.env`.
- **Post-deploy baseline (read-only `mongosh`):** 40 collections, 272 indexes, no `content_*`, 16 `tv_read_airings` indexes, 0 `program.entityId`: identical to §16.
- **This PR** rebased onto `bf7d047` (`git rebase --onto origin/main 14dce35`, no conflicts) and retargeted to `main`; the diff lists only the 2D-2E files. Backend lint clean; `npm test` with `TEST_MONGO_URI`: 454, 453 pass, 0 fail, 1 skip (Redis).
