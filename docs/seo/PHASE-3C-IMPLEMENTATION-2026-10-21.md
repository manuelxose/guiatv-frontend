# Phase 3C — verified entity publication and production safety (2026-10-21)

Written for: the owner and the engineers who will run the first canary. Contract: [PHASE-3-ENTRY-CONTRACT.md](PHASE-3-ENTRY-CONTRACT.md) v1.4. Runbook: [PHASE-3C-CANARY-RUNBOOK.md](PHASE-3C-CANARY-RUNBOOK.md). VPS: [../ops/VPS-RELIABILITY-RUNBOOK.md](../ops/VPS-RELIABILITY-RUNBOOK.md).

| Category | Status |
|---|---|
| 1. Engineering | **Complete** (this PR): AI-review attestation, certification lifecycle, admitted-scope write canary, canary allowlist builder, rehearsal, deploy and VPS safeguards |
| 2. Data | Proposed batch of **20 films** produced from today's replay and the round-2 AI ledger; rehearsed end to end on scratch MongoDB; **not written anywhere** |
| 3. Human approval | **Open and owner-only**: the signed grant for the batch (§9). The v1.3 attestation is not that |
| 4. Production activation | **Not attempted.** Every `CONTENT_*` / public-read / `EPG_YEAR_PROVENANCE` flag is unset; no persistent write, no public entity, no sitemap entry, no indexing |

PR #46's documentation (owner attestation, server outage record) is merged into this branch and kept verbatim (§1 of the Phase 3B report, contract v1.3). Nothing in this phase describes the AI review as human verification: every record says `reviewBasis: ai`.

## 1. The attestation model

An **attestation** answers one question: *did an owner-authorised AI review accept this exact identity on this exact evidence?* It is not a verification by a person and it is not an authorisation. Authority comes from a separate signed grant.

```
 identity candidate ──┐
 evidence verdict ────┤
 AI review ledger ────┼──▶ attestation record ──▶ pin on the entity ──▶ public read (re-checked at every read)
 owner grant (signed)─┤      (insert-only, hash-chained)
 canonical path ──────┘
```

| Element | What it is | Where |
|---|---|---|
| Candidate | stored `candidate` entity with `matching.assurance = independently_supported`, a TMDB work and a canonical path in the slug registry | `content_entities`, `content_slugs` |
| Evidence verdict | the gate's `AUTO_ACCEPT` line: no contradiction, nothing missing or unverified, independent support, path present; **pinned by SHA-256** | admit file / verdicts |
| AI review | the hash-chained ledger row: primary **and** second AI reviewer accepted (kind, TMDB and path labels `y`, `critical = n`), no open disagreement, ledger gate passed on `reviewBasis: ai`; reviewers, roles and decision hashes are copied into the record | `docs/seo/phase-3b/ai-review/round2/ledger.jsonl` |
| Owner grant | `OwnerAuthorizationPayload` signed with the owner's **Ed25519** key: scope `certify`, the manifest digest, **the exact AI-ledger head the owner saw** (a ledger that moved certifies nothing), the approved `(candidateId, verdictSha256)` items (≤ 25), an `executeBy` window **clamped to the evidence freshness**, the attestations' lifetime (`validDays`, ≤ 180) and the owner's own words | `content-certify authorize` (owner machine) |
| Attestation record | body + `seq` + `prevHash` + `hash`; embeds the grant, the previous `matching` (so revocation restores it), `attestedAt`, `validUntil` | `content_attestations` (insert-only) |
| Pin | `entity.certification = {attestationId, seq, hash, certifiedAt}` and `matching = {method: ai_attested, decidedBy: attestation:<id>}` | `content_entities` |

**Why a signature.** An agent that can run the CLI and write the grant file could otherwise authorise itself. The private key lives only on the owner's machine (`owner-keygen`, mode 0600, never overwritten); the server is given only the public key (`CONTENT_OWNER_PUBLIC_KEY_FILE`). Without it every certification and every read fails closed. Unit tests prove a self-issued grant, an edited payload and another key are all refused.

**Refusal reasons** (all are reported together; `certificationProblems`): entity not a candidate / not independently supported / without TMDB / pathless / unsupported kind; canonical registry mismatch or ambiguous ownership; verdict not accepted, contradicted, missing evidence, unverified, pathless, failing the evidence gate, bound to another identity or entity; AI review missing, not accepted, not AI, second review missing or dissenting, unresolved disagreement, gate failed, basis not `ai`; grant signature, ceiling, window, owner, batch membership, or verdict changed since approval, ledger head differs from the approved one.

**Read-time validity** (`evaluateCertification`, run on every public read): chain contiguous and unmodified; the pin equals the last record; `ai_attested` and `decidedBy` match; kind, canonical path and TMDB work still equal the attested ones; the grant's signature verifies against the configured owner key; the grant is still in bounds, still lists this verdict and still pins this ledger head; the stored `validUntil` cannot exceed `attestedAt + validDays` and `attestedAt` lies inside the grant's window (so a re-sealed record cannot outlive the grant); the chain is at most 100 records (longer is corrupt, never truncated); `now < validUntil`; the last record is not a revocation. Anything else is `not_found`, so the legacy page renders.

**Impersonation is closed in three places.** `normalizeReviewerName` refuses every `AI …` name (and `attestation:…`, `certify:…` fail its character set), so `verifyEntity`, the canary allowlist's `approvedBy` and the manual public-read branch reject an AI identity; `ai_attested` is a separate `EntityMatchMethod` that `mayBeIndexable` never accepts; review approval cannot bypass the quality tiers (an AI-attested identity is `unknown` on `identity_verified`, reaches at most the noindex `canary` tier and can never be an `index_candidate`).

## 2. Lifecycle

| State | Stored as | Public | Indexable |
|---|---|---|---|
| candidate | `candidate`, `assurance` set | no | no |
| certified | `active`, `ai_attested`, pin + valid attestation | **no by itself** | no |
| published | certified **and** in the canary allowlist **and** master switch + scope `canary` on **and** kill switch off | noindex, no-store, self-canonical, not in sitemaps | no |
| indexable | `indexability.state = index` | — | **never set by 3C**: needs a person, year provenance, internal links, legacy consolidation (quality criteria) |

Transitions: `certify` (candidate → active), `revoke` (active → candidate, previous matching restored, pin removed, record kept). A certified entity cannot be merged or removed (`certified_entity`) until revoked. Revoking is the safe direction, so it needs a named person and a reason but no owner signature. Re-certifying after a revocation needs a **new** grant (the attestation id includes the grant id; the revoked id is dead).

**Without transactions** (standalone Mongo): every operation is ordered single-document writes, resumable by calling it again.

| Operation | Step 1 | Step 2 | State if it stops between | Recovery |
|---|---|---|---|---|
| certify | attestation record (unique `(entityId, seq)` and `(attestationId, type)`) | entity promotion, conditional on `version` | `pending`: stored, entity still candidate, serves nothing | `certify` again reuses the stored record (tested: still one record) |
| revoke | revocation record | entity demotion, conditional on the pin | chain says revoked, entity still pinned: reads already fail closed | `revoke` again finishes |

Concurrency: three parallel `certify` calls leave one record and one active entity (tested); a losing writer gets `concurrent_modification` and can simply retry.

## 3. Write canary: bounded by construction

2D's write mode stores a title-key row for **every** decided candidate (thousands per day) even when only admitted ones create entities. A "25-identity" canary on that code would not be 25 rows. Phase 3C adds `CONTENT_IDENTITY_WRITE_SCOPE=admitted` (unset by default; the 2D behaviour is unchanged): a write run decides only candidates in the admit file, everything else is `out_of_scope` and writes nothing, and an admit file with more than 25 lines admits nothing. `CONTENT_IDENTITY_ADMIT_SHA256` (the manifest's `admitSha256`) pins the admit file to the approved batch: any other file, or a line added after approval, admits nothing, and setting it implies the admitted scope, so there is no second variable to forget.

**Manifest** (`content-certify manifest`, offline): replay verdicts + traces + the AI ledger + TMDB checks + public-page measurements in; a bounded, reproducible document out (`docs/seo/phase-3c/canary-manifest.json`, digest `03fa1569…`). It carries the exact approved batch, the admit file hash, review gate, evidence freshness (`freshUntil`), warnings, and per entity the three readiness answers kept apart: technical eligibility, content readiness, and why indexing is not on the table.

### Selection funnel (replay days 20261020–23, evidence produced 2026-10-21)

| Step | Count |
|---|---|
| accepted distinct identities (machine, independently supported) | 517 |
| films with an accepted AI primary **and** second review, no dissent | 92 (excluded: 123 never reviewed, 188 without a second review, 111 series/shows, 3 titles that are not works) |
| content measured and ready (synopsis ≥ 300 chars on the public page, TMDB genres + runtime, year, AdSense risk not high) | 48 (49 have a long enough synopsis; one of them lacks TMDB genres) |
| …whose legacy page is **not** indexable today (`noindex, follow`) | **20 → the proposed batch** |
| held back: legacy page is `index, follow` and the entity page would replace it | 28 |
| not ready: synopsis short or missing 43 (9 of them under 150 chars, AdSense-high; one also lacks year and genres), plus 1 with a long synopsis but no genres | 44 |

Ranking among eligible: legacy not indexable first, then days accepted, independent evidence roots, upcoming broadcasts, synopsis length, id (deterministic). 19 of 20 were accepted on a single replay day, so "stability" is weak evidence here: the recommendation is a fresh replay immediately before execution (the manifest refuses to run after `freshUntil`, 2026-10-25).

### Proposed batch (20 films, all `reviewBasis: ai`, two AI reviewers each: `AI Sonnet 5.5 A` primary, `AI Opus 5.5 B` blind second)

| # | Film | Year | Canonical path | Public synopsis (chars) | Upcoming airings | AdSense risk | Legacy page today |
|---|---|---|---|---|---|---|---|
| 1 | La cura del bienestar | 2017 | `/peliculas/la-cura-del-bienestar` | 491 | 2 | low | noindex |
| 2 | Venganza en Las Vegas | 2023 | `/peliculas/venganza-en-las-vegas` | 350 | 2 | low | noindex |
| 3 | Dobles vidas | 2018 | `/peliculas/dobles-vidas` | 474 | 1 | low | noindex |
| 4 | Los subdesarrollados | 1968 | `/peliculas/los-subdesarrollados` | 431 | 1 | low | noindex |
| 5 | La galaxia del terror | 1981 | `/peliculas/la-galaxia-del-terror` | 420 | 1 | low | noindex |
| 6 | Jinetes de la justicia | 2020 | `/peliculas/jinetes-de-la-justicia` | 377 | 1 | low | noindex |
| 7 | El exorcista III | 1990 | `/peliculas/el-exorcista-iii` | 371 | 1 | low | noindex |
| 8 | 22 balas | 2010 | `/peliculas/22-balas` | 362 | 1 | low | noindex |
| 9 | Jurassic World: Dominion | 2022 | `/peliculas/jurassic-world-dominion` | 344 | 1 | low | noindex |
| 10 | ¿Cómo se escribe amor? | 2014 | `/peliculas/como-se-escribe-amor` | 324 | 1 | low | noindex |
| 11 | Baño de sangre al salir el sol | 1966 | `/peliculas/bano-de-sangre-al-salir-el-sol` | 449 | 0 | medium | noindex |
| 12 | AmeriGeddon | 2016 | `/peliculas/amerigeddon` | 418 | 0 | medium | noindex |
| 13 | Las catadoras de Hitler | 2025 | `/peliculas/las-catadoras-de-hitler` | 418 | 0 | medium | noindex |
| 14 | Morir no siempre sale bien | 2026 | `/peliculas/morir-no-siempre-sale-bien` | 376 | 0 | medium | noindex |
| 15 | El valle de la furia | 1980 | `/peliculas/el-valle-de-la-furia` | 353 | 0 | medium | noindex |
| 16 | Bats (Murciélagos) | 1999 | `/peliculas/bats-murcielagos` | 337 | 0 | medium | noindex |
| 17 | Suzhou River | 2000 | `/peliculas/suzhou-river` | 315 | 0 | medium | noindex |
| 18 | Pecados del pasado | 2006 | `/peliculas/pecados-del-pasado` | 314 | 0 | medium | noindex |
| 19 | Tres tejanos | 1949 | `/peliculas/tres-tejanos` | 312 | 0 | medium | noindex |
| 20 | El desafío de Pancho Villa | 1972 | `/peliculas/el-desafio-de-pancho-villa` | 301 | 0 | medium | noindex |

Every path is inherited from the legacy page that already answers it (stable ownership; no collision, no `historic_*` doubt, no other identity claims it).

### Quality results, stated plainly

- **Technical eligibility:** all 20 pass: independent evidence, two AI accepts, clean canonical ownership, work titles, no duplicate title+year.
- **Content ready (upstream):** all 20: public synopsis 301–491 characters, TMDB genres and runtime, year, no AdSense-high page. Median synopsis 367 characters. The text is third-party (TMDB); there is no original editorial text, so the risk is `low` only for the ten with a scheduled broadcast and `medium` for the other ten.
- **What "ready" does not mean:** admission stores title, year, TMDB id and path only. **The entity itself has no synopsis or genres**, so a public canary page would show title and year (and "Sinopsis no disponible"). "Ready" means the facts exist upstream and a sourced copy can fill the page. That copy, an upcoming-broadcast block, internal links and legacy consolidation are Phase 3D. They do not block the write canary or certification, which publish nothing.
- **Needs enrichment (not in the batch):** 44 films: 43 with a synopsis under 300 characters or none (9 of them under 150, AdSense-high; one also missing year and genres) and 1 with a long synopsis but no genres. Listed with reasons in the manifest's `notSelected`. No text was generated to fill them.
- **Google indexing readiness: none of the 20.** Blockers for every entry: no person-verified identity, year provenance unmeasured (`EPG_YEAR_PROVENANCE` off), description source unrecorded, no internal links, legacy page live at the same URL, SSR reliability not yet measured, programme context for ten.

### The legacy-URL finding (needs the owner's eyes)

The entity page answers at the **same URL** as the legacy page and replaces it while served. Measured on production today (public GETs, 92 candidates): 52 legacy pages are `index, follow`, 40 are `noindex, follow`. A canary on an indexable page would swap a rich page for a bare noindex one. The proposed batch therefore uses only films whose legacy page is already `noindex` (no indexing loss). `--allow-indexed-legacy` exists and is off; if used, each affected entry shows `indexableToday: true`.

## 4. Rehearsal and database safety (scratch MongoDB, the real batch)

`content-certify rehearse` / `ContentCanaryRehearsal.mongo.test` run the real ingestion in admitted scope, the real certification, the real canary policy and the real rollback against a throwaway database (it refuses any name that is not `guiatv_scratch_*`, `guiatv_rehearsal_*` or `guiatv_test_*`), comparing a whole-database baseline at each step. The committed report is [phase-3c/rehearsal-report.json](phase-3c/rehearsal-report.json): **20 of 20 checks pass**.

| Step | Measured result |
|---|---|
| manifest valid | 20 entities, digest `03fa15694ddb` |
| enabling `CONTENT_ENTITIES_ENABLED` | creates only the four empty `content_*` collections (entities, slugs, title keys, attestations) and their indexes |
| dry run (shadow) | database baseline identical |
| write run | **exactly** 20 entities, 20 slugs, 20 title keys; the 20 non-batch films written nothing (`out_of_scope` 20/20); no other collection changed |
| stored shape | every entity `candidate`, `independently_supported`, `noindex`; canonical paths equal the manifest |
| replays (two further days) | baseline identical (idempotent) |
| certification dry run | no refusal reason; baseline identical |
| allowlist builder before certification | refuses all 20 (`certification_none`) |
| certification | only `content_attestations` changes (20 records); a second pass changes nothing |
| public read | the whole batch served through the canary policy; a path outside it is not |
| revocation | nothing served afterwards |
| rollback | removes the 20 entities, slugs and title keys; **only the audit trail remains** (20 attestations + 20 revocations) |

Production baseline method: `content-certify baseline --out before.json`, then `baseline --compare before.json --structural` after each step (read-only guard; other collections' traffic-driven counts are ignored, new collections, any index change and `content_*` documents are not). The last production baseline taken (3B, today, after the reboot): 40 collections, 272 indexes, no `content_*`. **No production database command was issued in this phase.**

## 5. Public-read integration (nothing weakened)

| Invariant | State |
|---|---|
| Master switch alone serves nothing; scope `canary`/`all` must be written; canary needs an allowlist and a ceiling ≤ 25 | unchanged, tested |
| Allowlist entries need a named **person** as `approvedBy` | unchanged; an AI name is refused |
| Canonical validation (`resolvePath` ownership checks) | unchanged and run first; the certification check is additional |
| Provisional/candidate entities never served | unchanged; `pending` serves nothing |
| Kill switch, breaker, legacy fallback (every refusal answers like "disabled") | unchanged; tested with certified entities (`entities.certified.test`) |
| `X-Robots-Tag: noindex, follow`, `no-store`, single self-canonical, sitemap exclusion of exactly the allowlisted paths | unchanged; tested |
| Reads write nothing | tested with command monitoring |
| Public DTO | `entityId, kind, title, canonicalPath, year`: no attestation, review or provenance leaks |
| Revalidation at each read | signature, expiry, revocation, pin, binding; tampering with a record or the pin, a missing owner key and an expired attestation each tested to fail closed |

A canary-check CLI (`content-identity canary-check`) uses the same reader, so the cron monitor agrees with the route.

## 6. VPS reliability

Evidence kept as found (§12 of the 3B report): two abrupt outages, the previous boot's journal ends mid-service with **no shutdown sequence, OOM or panic**. The cause is **not established**; a provider-side stop is the only hypothesis the evidence points to, and the memory evidence (peak 2.7 GB of 11.9 GB during a build) does not support pressure. This phase reduces risk whichever it is.

| Gap | Delivered | Where | Verified by |
|---|---|---|---|
| Nothing watching from outside; the in-host watchdog dies with the host | External probe every 15 min from GitHub Actions: plain HTTP redirects to HTTPS, TLS certificate ≥ 14 days left, home, API health, robots, sitemap index, a hub page, **and the invariant that public entity reads are still off** | `.github/workflows/uptime.yml`, `scripts/uptime-probe.mjs` | 5 unit tests; real runs against production (8/8 ok; one transient 10 s connect failure on the home page during testing recovered on the retry, which is what the retries are for) |
| Docs-only pushes deployed to production | `paths-ignore` in `deploy.yml`; the server script also skips an already-live commit and a docs-only diff | `deploy.yml`, `deploy-guiatv.sh` | sandbox deploy test; `workflows.test.mjs` keeps both lists in step |
| Two deploys at once | host-level `flock` (exit 75, nothing changed) on top of the workflow concurrency group | `deploy-guiatv.sh` | sandbox: second deploy refused while the lock is held |
| Build memory pressure | pre-flight `MemAvailable` check (default 3500 MB, exit 75 before any change), `--max-old-space-size` (3072), `nice`/`ionice`, optional cgroup `BUILD_MEMORY_MAX`; `npm install` skipped when the lockfile is unchanged | `deploy-guiatv.sh` | sandbox: refused deploy built and published nothing |
| Compiling on the production host | **Artifact deploy**: CI builds with budgets, ships a checksummed tarball; the server verifies checksum and commit, unpacks, publishes, smoke-tests and rolls back as before, with no install and no compile. Manual workflow until the owner approves switching | `deploy-artifact.yml`, `deploy-guiatv.sh` args 2–3 | sandbox: corrupt and wrong-commit artifacts refused, valid one deployed without `npm` build/install |
| Cold start after a reboot | post-boot service: waits for the services, records whether the previous boot ended without a shutdown sequence (fact, not cause), checks units, release and activation flags (names only), warms the hubs one at a time | `infra/systemd/guiatv-post-boot.service`, `scripts/post-boot-check.mjs` | unit tests for the pure parts; **not installed** (ops step) |
| Slow, manual rollback | `guiatv-ops.sh rollback [id]`, `restart`, `warm`, `status`: lock, verified, never reboots | `scripts/guiatv-ops.sh` | sandbox rollback test |

**Changed after the independent review** (standards and spec sub-agents): the grant now pins the ledger head and its window cannot outlive the evidence; the admit file can be hash-pinned; contradictions on any replay day exclude an identity; the artifact deploy refuses a changed lockfile instead of running new code on stale dependencies; host-run scripts are no longer in the `paths-ignore` list (the server checkout only advances on a deploy); the docs-only test no longer pipes under `pipefail`; the post-boot check no longer treats the public key path as an activation flag; one cap constant.

**Not done, deliberately:** installing the post-boot unit, switching `deploy.yml` to artifacts, enabling the cgroup cap, configuring a webhook, rebooting or redeploying the VPS. Each needs the owner's operational approval. Provider-side question for Contabo (migration, reset, host maintenance on 2026-10-20 and 21) is in the runbook. Observation worth a look: `/robots.txt` took 17.6 s on one cold request today and 0.16 s warm.

## 7. Production flags (exact)

| Flag | Production | After this PR is merged and deployed |
|---|---|---|
| `CONTENT_ENTITIES_ENABLED`, `CONTENT_IDENTITY_*`, `CONTENT_ENTITY_*`, `CONTENT_OWNER_PUBLIC_KEY_FILE`, `EPG_YEAR_PROVENANCE` | none set (checked by name only after the 3B deploy and again after the reboot) | unchanged: off |
| New collection `content_attestations` | does not exist | **still does not exist**: it is created only at boot with `CONTENT_ENTITIES_ENABLED` on, like the other three |
| Behaviour of the deployed code with all flags off | — | identical to 3B: the new code is inert (the public read returns the legacy signal before reaching it) |

## 8. Tests and CI

| Check | Result |
|---|---|
| Backend suite (scratch MongoDB 8, standalone) | **555 tests: 554 pass, 0 fail, 1 existing Redis skip** (513 before 3C; +42). Run against a standalone scratch mongod, per-pid databases, all dropped |
| New coverage | pure rules (grant signature/bounds, ledger pin, refusal reasons, chain, read-time validity, quality tiers, admit-file ceiling and pin, 14); lifecycle on Mongo (certify, idempotency, refusals leave no trace, ambiguous ownership, revocation, removal guard, both crash windows, concurrency, tamper/expiry/key loss, insert-only, 12); manifest (6, including reproducing the committed digest); rehearsal (3); certified public reads through the real route (1); owner CLI flow (1) |
| Backend typecheck | PASS |
| Deploy script sandbox (`npm run test:deploy`) | PASS: history rewrite, rollback on smoke failure, lock, memory guard, already-live, docs-only, `FORCE_DEPLOY`, artifact (corrupt / wrong commit / valid), ops rollback. Checked for sensitivity: removing the lock or the docs-only rule makes it fail |
| Ops scripts (`npm run test:ops`) | 13 pass: uptime probe, post-boot parsers, workflow guarantees (no activation flag in any workflow, docs never deploy, probe is off-host and read-only, artifact deploy is manual, actions pinned) |
| SSR cache/canonical/canary-verify scripts | 15 pass; frontend source unchanged in 3C |
| CI on the PR | {{CI}} |

## 9. Remaining operational risks

1. **Weak stability evidence:** 19 of 20 identities were accepted on one replay day. Mitigation: re-run the replay and rebuild the manifest immediately before execution; the tool refuses stale evidence.
2. **AI review limits (unchanged from 3B):** TMDB is both the gate's source and the reviewers' main source; same-family models are not independent humans; labels measure coherence with TMDB. `reviewBasis: ai` stays on every record.
3. **Same-URL replacement:** even the noindex-legacy batch shows a bare page publicly (title and year) until the metadata copy exists. Do not run the public canary before Phase 3D's copy unless that is acceptable.
4. **Cause of the outages unknown.** The external probe will show duration and pattern; the post-boot record states facts only.
5. **Owner key custody:** losing the private key stops new certifications (existing ones stay valid until `validUntil`); leaking it lets someone authorise. Rotate by configuring a new public key: old attestations then fail closed, which is the safe direction.
6. **Revocation is per process-independent but cache-dependent at the edge:** entity responses are `no-store`, but **adding** an entity needs an SSR restart (3B finding); removing one does not.
7. **The uptime probe depends on GitHub schedules** (delays of several minutes are normal) and notifies via the repository's failure emails; a webhook secret is optional.
8. The `content_attestations` retention is forever by design (audit); size is negligible (≤ 25 per canary).
9. **Threat model:** the signature protects the *authority* (no agent can grant itself certification) and bounds validity. Someone with direct write access to MongoDB can still alter entities (as they could before 3C, e.g. mark one `manual`); the hash chain makes ordinary edits detectable, not impossible for an attacker who re-seals it. The quality gate for a batch is enforced at manifest and CLI level (`content_not_ready` refuses `certify`), not inside the service, because the entity stores no page content yet.
10. The uptime probe does not (yet) check certificate chain validity beyond expiry, nor Cloudflare-to-origin separately.

## 10. Exact owner approvals needed for the first canary

Nothing below is implied by anything already given (the v1.3 attestation included).

1. **Choose the batch:** approve the 20 films above, or edit the list (smaller is fine; never above 25); decide whether pages whose legacy URL is currently indexable may ever be used (default: no).
2. **Generate your signing key on your own machine** (`owner-keygen`), keep the private key off the server and the repository, and give the public key to the server (`CONTENT_OWNER_PUBLIC_KEY_FILE`).
3. **Sign the grant** for the final manifest (`authorize`), with your statement, an `executeBy` window and the attestation lifetime. The server will not certify anything without it.
4. **Authorise, in writing and separately,** (a) enabling `CONTENT_ENTITIES_ENABLED` (creates four empty collections + indexes), (b) the admitted-scope write run with `CONTENT_IDENTITY_MAX_CREATES≤25` and the admit file (writes 20 candidates + slugs + title keys, nothing public), (c) running `certify --apply`.
5. **Operational approval** to run these steps in a quiet window with the deploy lock free, after a fresh replay, with rollback ready (`revoke-batch` then `rollback-batch --apply`).
6. **Public canary (a later, separate approval):** the person named as `approvedBy`, the allowlist produced by `allowlist`, the flags (`PUBLIC_READ_ENABLED`, scope `canary`, ceiling, kill file) and an SSR restart, only once page content is acceptable (§3).

## 11. Recommended Phase 3D scope (not started)

(a) A **sourced metadata copy** from the catalogue into the entity (synopsis, genres, runtime, with provenance) at or after admission, so a canary page is worth showing; (b) the entity page's upcoming-broadcast block and internal links; (c) a legacy-consolidation decision per URL (redirect, replace, or keep) before any indexable legacy page is touched; (d) `EPG_YEAR_PROVENANCE` for one sync cycle so the year can become independent evidence; (e) execution of this phase's first canary with the approvals above, followed by a person-verified sample if the owner wants indexing at any point; (f) the owner decision on switching `deploy.yml` to artifact deploys and installing the post-boot unit.
