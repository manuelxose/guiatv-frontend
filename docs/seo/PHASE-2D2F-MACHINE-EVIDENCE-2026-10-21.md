# Phase 2D-2F: automated machine-evidence quality gate (2026-10-21)

Status legend: **[V]** verified by a run recorded here, **[P]** proposed, not executed.

## 0. Summary

- PRs #37 (2D-2D) and #38 (2D-2E) are merged and deployed. Production identity flags are still unset, and production holds no `content_*` rows.
- A new pipeline classifies every identity candidate as `AUTO_ACCEPT`, `AUTO_REJECT` or `QUARANTINE`. It works from the read-only shadow traces and needs no human labels on individual rows. It counts only evidence that the identity match did not itself produce.
- **Full production day `20261020`** (11,211 airings, 3,145 proposed identities):
  - 529 auto-accepted (16.8%);
  - 48 slot titles auto-rejected (189 airings);
  - 2,616 quarantined.
- **Machine-evidence gate: pass.** No known canonical-ownership violation, cross-kind merge or episode-as-work among the accepted identities, and every accepted identity has independent evidence. The result is deterministic: two runs give identical traces and verdicts, and the archived files reproduce the same digest offline.
- **Human-validated precision: not measured. The human write gate (`score --verify`) is unmet**, because no human labels exist. That gate is unchanged. Production writes are still not authorised, and none were made.
- **Two systematic errors were found that earlier phases could not see:**
  - **The EPG year is not independent evidence.** The EPG sync overwrites it with the TMDB year it matched (`SyncEPGData.ts` lines 927 and 1054).
  - **TMDB search picks among homonyms.** Example: "Bordertown T3 E4" in a 2026 Spanish EPG is bound to the 1989 series, while the 2016 series has the same original title.

## 1. PR integration [V]

| PR | Head | CI | Merge | Release | Deployed SHA |
|---|---|---|---|---|---|
| #37 2D-2D quality gate | `14dce35` | verify, ssr-resilience green | squash `bf7d047` | `20261021164208` | `bf7d047` |
| #38 2D-2E normalisation | `926202a` (rebased on `bf7d047`, retargeted to `main`) | verify, ssr-resilience green; post-merge main CI green | squash `621a2c3` | `20261021170548` | `621a2c3` (`release.json`) |

- **#37 review before merge:**
  - every audit command runs under `installReadOnlyGuard` (exit 97 on a write, DDL or `$out`/`$merge`);
  - every flag is off by default, and writes need `CONTENT_IDENTITY_WRITES` equal to the database name;
  - no route, controller, sitemap, canonical or SSR file changed.
- **#38:** the rebase had no conflicts, and the diff lists only 2D-2E files. Retargeting the PR produced no CI run (the push landed while the base was still #37's branch). Closing and reopening the PR to retrigger CI was refused by the session's permission policy. CI ran on a real follow-up commit instead (`926202a`, integration status in the 2D-2E report §19).
- **After each deploy:**
  - `api` and `ssr` active, `/health` 200, home 200, no `CONTENT_*` in `api.env`;
  - read-only baseline: 40 collections, 272 indexes, no `content_*`, 16 `tv_read_airings` indexes, 0 `program.entityId`.

## 2. Evidence policy (`ContentIdentityEvidence.ts`)

Decisions are taken **per proposed identity**: a contradiction in any of its airing groups quarantines the whole entity.

| Evidence | Independent? | Why |
|---|---|---|
| TMDB search made for this check (`tmdb-check.js`): the bound work is the **only** work of its type whose title or original title has the candidate's key | **yes** | A fresh query of TMDB's full index, testing the homonym failure the sync's search can't see |
| Legacy GuíaTV URL already answering the planned path for the same title key (`historicOwner`) | **yes** | Ownership predates the identity run |
| Stored `verified` title-key row | **yes** | Manual or exact TMDB (none in production yet) |
| Catalogue row confirming the airing's TMDB id | no | It is the sync's own match result |
| EPG year agreeing with the TMDB year | no | The sync writes the TMDB year into it; a mismatch still contradicts |
| Same key and kind on other days | no | The same rules on other input: stability, not truth |
| Episode markers | no | Shape evidence only |
| Deterministic slot rules | n/a | Basis for `AUTO_REJECT` only |

**Acceptance needs** no contradiction, no missing evidence and at least one independent item:
- **Film:** a TMDB search showing the bound film is the only exact-title film. A title-only film is never accepted (remake risk).
- **TV work with TMDB:** the same TMDB uniqueness test, with type `tv`.
- **Title-only TV work:** all three of
  - a legacy URL owner;
  - the same kind on at least 2 of the 5 other days;
  - one broadcaster (`broadcasterKey`: the channel name compacted, so one channel ingested from two feeds counts once).

**Contradictions (any one quarantines):**
- TMDB id unconfirmed or mixed; cross-kind; duplicate slug; path collision;
- pathless because another or an unbound work owns the slug; legacy owner conflict;
- the title still parses as an episode or no-work; the kind changes across days;
- a film with episodes; TMDB type differs from the kind; a film year mismatch; the TMDB work not among the exact-title results;
- for title-only works, title residue: a trailing number, a parenthetical, a spaced separator, a date, a part marker, a container prefix (`Serie: X`), a time of day (`JT 19h30`), slot-only wording, or a news edition of another proposed programme (`Noticias Cuatro mediodía`).

**Kind basis.** Films are typed by TMDB. **Series vs show is the broadcaster category for every TV work** (TMDB has no such split), and it is reported as `kindBasis: category`.

**Models (`ContentIdentityAdjudication.ts`, optional)** run on at least two distinct models, with bounded concurrency, retries, a cache, token and USD accounting and a spending cap. A model can only turn an `AUTO_ACCEPT` into `QUARANTINE`. Agreement between models never upgrades anything. **It was not run:** there is no Anthropic key locally or on the server, and no spending approval. The provider transport is not wired in; it needs `@anthropic-ai/sdk` plus a key.

## 3. Systematic errors found and corrected [V]

Each one was reproduced on production traces, fixed with a regression test, and re-checked by replaying the same day.

| # | Pattern (production example) | Root cause | Correction | Effect on `20261020` |
|---|---|---|---|---|
| 1 | "ETB2 · Eguraldia" became the work "ETB2" at `/programas/etb2` | The feed writes `<channel> · <programme>`; the parser took the channel as the work | `stripChannelSegment` (domain) drops a leading or trailing ` · ` segment naming the airing's own channel, using its names and aliases. Traces now carry broadcaster keys | Proposed entities 1,664 → 1,662 |
| 2 | "9-1-1" accepted via TMDB 75219 while its episode spellings carried TMDB 65733 (unconfirmed) and year 2005 | Verdicts were per candidate, not per entity | One decision per identity; in-run binds are part of the entity | 40 in-run binds now judged with their entity |
| 3 | "Bordertown" (TMDB tv 554, 1989) for "Bordertown T3 E4" | The sync's TMDB search keeps the most popular match; the "EPG year" is the matched year | Independent TMDB search; exact-title homonyms quarantine (`tmdb_homonyms`); year agreement no longer counts | 73 homonym identities quarantined (e.g. Aída, Big Bang, Anaconda, Arrebato) |
| 4 | "Informativo Territorial" and similar on several broadcasters | The same title on different broadcasters may be different programmes; duplicate channel feeds hid this | Single-broadcaster rule with broadcaster keys ("ETB 2" = "ETB2.TV"; "Canarias.TV" ≠ "TV Canaria", kept apart on purpose) | 446 → 290 identities blocked once feed duplicates collapse |
| 5 | "Espacios comerciales", "Videoclips", "Boletín informativo", "Informativo mediodía", "Newsroom" | Slots not in `GENERIC_TITLE_KEYS` | Slot-wording rule (quarantine, not reject) | 62 quarantined |
| 6 | "Serie: Autopista hacia el cielo" next to "Autopista hacia el cielo"; "SERIE «EL VIRGINIANO»" | Broadcaster container prefix | `container_prefix` residue | 4 |
| 7 | "Noticias Cuatro mediodía" next to "Noticias Cuatro" | News editions as separate works | `edition_of` when another proposed key plus slot words only; spin-offs ("Ley y orden: unidad de víctimas especiales") pass | 37 |
| 8 | "El inmortal (extras)", "Monteando … 1º parte", "JT 19h30" | Variant and part tags | Residue rules | 21 / 2 / 7 |

**Accepted identities after each step** (the same traces, read-only):

| Step | Accepted identities |
|---|---|
| First policy (per-candidate verdicts; catalogue match and year counted as proof) | 849 candidates |
| After 2–4 (per identity, TMDB search, channel ids) | 470 |
| After broadcaster keys (#4) | 537 |
| After 5–8 | **529** |

All replays: 0 canonical collisions, 0 cross-kind merges, 0 accepted episode-level entities.

## 4. Full production replay `20261020` [V]

The replay ran 2026-10-21 at about 15:30 UTC (`phase-2d2f/run-evidence.sh`, build = this branch).
- **Target day:** `20261020` (latest fully rebuilt), run twice, no creation cap.
- **Other days:** 20261013 and 20261016–19, used as cross-day observations.

| Metric | Result |
|---|---|
| Airings | 11,211 |
| Excluded airings | slot 108, unkeyable 36, episode-only 45, sport 1,370 |
| Candidates (identity contexts) | 3,187 (plus 48 rejected slot titles) |
| Proposed entities (shadow ingestion) | 1,662 |
| Identities | 3,145: **529 AUTO_ACCEPT**, **2,616 QUARANTINE** (83.2%); 48 slot titles AUTO_REJECT |
| Accepted by kind | show 317, series 95, movie 117 |
| Accepted by independent source | legacy URL 312; legacy URL + TMDB search 216; TMDB search 1 |
| Accepted airings | 1,494 of 9,652 candidate airings |
| Canonical paths of accepted identities | 529 with a path, 528 to a verified legacy owner, 0 pathless, 0 collisions |
| Main quarantine reasons (an identity can have several) | unknown kind 1,335; title-only on several broadcasters 290; seen on <2 other days 471; no legacy URL 224; legacy path owned by an unbound TMDB work 213; title-only film 150; title uncertain 119; TMDB homonyms 73; title residue 165; edition 37; cross-kind 30 |
| Gate violations | 0 / 0 / 0 / 0 / 0 |
| Determinism | trace runs 1 and 2 byte-identical; verdicts identical; digest `d8aeca9c7303a1ae…` reproduced offline from the archive |
| Runtime and memory | per day 6–10 s, 142–184 MB peak RSS (1.2 GB cap, pool 2); evidence step offline, < 1 s |
| Database commands | 186–199 per day, all `find`/`getMore`/`endSessions`; the guard never tripped; 0 writes, 0 DDL |
| TMDB | 299 queries, 336 GET requests, 0 retries, 0 failures; the second run was served from the cache (0 requests) |
| Baseline before = after | identical: 40 collections, 272 indexes, no `content_*`, 16 airing indexes, 0 entity refs, 0 path refs, 11,211 airings |
| Entity rows before / after | 0 / 0 |

Bounded read-only `mongosh` reads were also made for diagnosis:
- the day list;
- one airing's channel object;
- the channel metadata of one day.

The VPS `/tmp/guiatv-2d2f` was removed after every run.

## 5. Quality status

| Gate | Meaning | Status |
|---|---|---|
| **Machine-evidence gate** (`content-identity evidence`, exit 0 on pass) | No known violation among accepted identities; every acceptance has an independent evidence trail; every conflict quarantined; deterministic | **pass** on `20261020` |
| **Human write gate** (`content-identity score --verify`, unchanged) | ≥ 300 labelled `auto_create` rows, observed precision ≥ 98% with the exact bound, second reviewer on ≥ 50 rows, 0 open disagreements, every error categorised | **unmet: 0 human labels** |

The machine gate is not a precision estimate. The share of accepted identities that are actually right is unknown until people label a sample. The 2D-2E sheet and protocol stand. A sheet drawn from the 529 accepted identities would label the subset a write canary would use.

**Identity classes that are still unverified:**
- **Series vs show** for every TV work: the broadcaster category only (412 accepted identities).
- **Title-only TV works:** identity rests on a legacy URL plus same-broadcaster stability. Two different programmes with the same title on the same broadcaster on different days would pass.
- **Unknown-kind titles** (1,335): never accepted.
- **TMDB homonyms** (73) and **title-only films** (150): need a raw XMLTV year (§7) or a person.
- Channel-name suffixes without a separator ("Eguraldia ETB1") are accepted as their own work.

## 6. Tests and CI

| Check | Result |
|---|---|
| Backend lint (`tsc`) | clean |
| Backend `npm test` with `TEST_MONGO_URI` (scratch `mongod` 8.0) | **469: 468 pass, 0 fail, 1 skip** (Redis, as before) |
| New: evidence (11 tests) | TMDB uniqueness and homonyms, year not evidence, title-only rules, no circular proof, per-identity decision (the 9-1-1 case), every contradiction class, slot wording with look-alikes that must pass, editions vs spin-offs, gates detect each planted violation, digest determinism |
| New: adjudication (2 tests) | never upgrades, disagreement quarantines, two distinct models required, token and USD accounting, cache, retries, bounded concurrency, spending cap |
| New: domain `stripChannelSegment`; Mongo ingestion case (channel segment, broadcaster keys) | pass |
| Existing tests changed | none |

## 7. Remaining blockers for persistent writes

1. **Human labels**: the write gate requires them and stays unmet.
2. **Raw XMLTV year**: the EPG sync overwrites `program.year` with the TMDB year. [P] Keep the feed year in its own field (for example `sourceYear`) so remakes and homonyms can be told apart independently. This changes stored EPG documents, so it ships separately and with approval.
3. **Series vs show**: decide whether the URL prefix may rest on the broadcaster category, or quarantine TV works without a TMDB genre signal.
4. **Airing entity index**: still to be built by hand, off-peak, before any release that writes airing refs (2D-1 note).
5. **Optional model adjudication**: needs an Anthropic key, the SDK dependency and a spending cap approved by the owner.

## 8. Proposed write canary [P], not executed

**Scope:**
- the `AUTO_ACCEPT` identities of one fully rebuilt day, re-adjudicated on the canary day;
- capped at 100 entities with `CONTENT_IDENTITY_MAX_CREATES=100`;
- films with a unique TMDB result plus a legacy URL owner first, then TMDB TV works.

**Preconditions:**
- the human gate passes on a sheet drawn from `AUTO_ACCEPT`;
- the owner authorises it in writing;
- a fresh `mongodump` of `guiatv`;
- the airing index built beforehand (only if airing refs are enabled; propose them off for the canary).

**Steps:**
1. Set `CONTENT_ENTITIES_ENABLED=true` and `CONTENT_IDENTITY_WRITES=guiatv`.
2. Restart. The boot creates the three empty collections and their indexes.
3. Run one rebuild.
4. Compare the written rows against the evidence verdicts: every written entity must be `AUTO_ACCEPT` and every path the planned one.
5. Leave `CONTENT_IDENTITY_AIRING_REFS` off.
6. No public surface reads entities in 2D-2, so nothing reaches Google.

**Rollback:** unset the flags and restart. Optionally drop the three `content_*` collections, which hold only canary rows.

**Abort on any of:**
- a written entity that the evidence step quarantined;
- a canonical collision;
- a write outside the three collections;
- an API 5xx increase.

## 9. Artefacts (`docs/seo/phase-2d2f/`)

| File | Contents |
|---|---|
| `run-evidence.sh` | VPS runbook: baseline, the target day twice, other days, TMDB check, baseline comparison, determinism and guard checks |
| `tmdb-check.js` | read-only TMDB search per TMDB-backed candidate (GET only; 4 at a time, retries, cache) |
| `traces-20261013-20261020.tar.gz` | trace dumps of the six days (logger lines removed) |
| `tmdb-checks-20261020.json` | the TMDB search results used |
| `verdicts-20261020.jsonl` | every candidate's verdict with its evidence trail |
| `evidence-20261020.json` | gate output |
| `baseline-20261021-{before,after}.json` | production counts around the run |

**Reproduce offline:**

```sh
tar xzf traces-20261013-20261020.tar.gz -C /tmp/t
node dist/scripts/content-identity.js evidence /tmp/t/traces-20261020-run1.jsonl /tmp/t/traces-2026101{3,6,7,8,9}.jsonl --tmdb tmdb-checks-20261020.json
```

The output digest is `d8aeca9c…`.
