# Phase 3C canary runbook (write canary, certification, public canary)

Nothing here has been run. Every step needs the owner's separate written approval (Phase 3C report §10) and a quiet window. All commands run on the server from `/var/www/guiatv/apps/backend` unless marked **owner machine**. `A` below is `node dist/scripts/content-certify.js`, `I` is `node dist/scripts/content-identity.js`.

**Abort rule.** Stop at the first unexpected output, roll back from the step you are at (§Rollback), and report; never "fix forward" a canary.

## 0. Preconditions

1. No deploy running (`guiatv-ops.sh status`; the deploy lock is free) and the last release healthy.
2. External probe green for the last hour (GitHub Actions → External uptime probe).
3. Fresh evidence: re-run the replay (`docs/seo/phase-2d2f/run-evidence.sh`, read-only guard) for the latest full day plus the next days, and the legacy probe. Then rebuild the manifest; if its digest differs from the one the owner approved, **stop: the owner approves the new one**.

```bash
node scripts/canary-legacy-probe.mjs --pool pool.json --origin https://guiaprogramaciontv.com --out probes.json
A manifest --day <traces>:<verdicts-YYYYMMDD.jsonl> [--day …] --tmdb <tmdb-checks.json> [...] \
  --ledger docs/seo/phase-3b/ai-review/round2/ledger.jsonl --sheet docs/seo/phase-3b/round2/review-sheet-3b-r2.csv \
  --probe probes.json --size 25 --out manifest.json --admit-out admit.jsonl
```

4. Database baseline: `A baseline --out /root/canary-before.json` (read-only guard). Expected today: 40 collections, 272 indexes, no `content_*`.

## 1. Owner: key and signed grant (owner machine)

```bash
A owner-keygen ~/guiatv-owner-key          # once; keep owner-private.pem off the server and out of git
A authorize --manifest manifest.json --private-key ~/guiatv-owner-key/owner-private.pem \
  --owner manuelxose --statement "<your own words>" --execute-days 7 --valid-days 30 --out authorization.json
```

Copy `authorization.json` and `owner-public.pem` to the server. Check there: `A verify --manifest manifest.json --authorization authorization.json --public-key owner-public.pem --admit admit.jsonl` (exit 0).

## 2. Enable the collections (separate approval 4a)

Set `CONTENT_ENTITIES_ENABLED=true` in `/etc/guiatv/api.env`, restart the API (`guiatv-ops.sh restart`). Boot creates four empty collections and their indexes. `A baseline --compare /root/canary-before.json --structural` must list exactly `content_entities`, `content_slugs`, `content_title_keys`, `content_attestations`, zero documents.

## 3. Write canary (approval 4b)

In `/etc/guiatv/api.env`: `CONTENT_IDENTITY_WRITES=guiatv`, `CONTENT_IDENTITY_WRITE_SCOPE=admitted`, `CONTENT_IDENTITY_ADMIT_FILE=<admit.jsonl>`, `CONTENT_IDENTITY_ADMIT_SHA256=<manifest admitSha256>` (pins the file to the approved batch and implies the admitted scope), `CONTENT_IDENTITY_MAX_CREATES=25`. `CONTENT_IDENTITY_AIRING_REFS` stays unset. Restart; the next read-model rebuild writes the batch (or trigger one for the evidence day).

Verify (all must hold): `I pathless` lists none of the batch; `A status --manifest manifest.json` shows `candidate` for every entry and `certification: none`; `A baseline --compare … --structural` shows exactly +N documents in entities, slugs and title keys and nothing else; run the same rebuild again and the baseline does not move (idempotent). **Then unset the write flags and restart**: the canary does not need them to stay on.

## 4. Certify (approval 4c)

```bash
export CONTENT_OWNER_PUBLIC_KEY_FILE=/etc/guiatv/owner-public.pem   # also in api.env for the public read
A certify --manifest manifest.json --authorization authorization.json --admit admit.jsonl \
  --ledger docs/seo/phase-3b/ai-review/round2/ledger.jsonl --sheet docs/seo/phase-3b/round2/review-sheet-3b-r2.csv          # dry run: lists every refusal
CONTENT_ENTITIES_ENABLED=true CONTENT_IDENTITY_WRITES=guiatv A certify … --apply
```

Expect `refused: 0`, then `A status` shows `certified` for all; baseline +N documents in `content_attestations` only. Public effect: none (no flag serves anything yet).

## 4b. Metadata enrichment (Phase 3D; new write step, needs its own written approval)

Certified entities hold identity only. Before any public canary, copy the catalogue's TMDB facts onto them (title, original title, year, runtime, genres, synopsis, artwork paths, credits, with provenance and freshness):

```bash
A enrich --manifest manifest.json                       # dry run: a plan or refusal reason per film, nothing written
A enrich --manifest manifest.json --apply               # needs CONTENT_ENTITIES_ENABLED + CONTENT_IDENTITY_WRITES=<db>
A enrich --manifest manifest.json --apply --refresh-catalogue   # only for rows never fully fetched from TMDB (calls TMDB through MediaCatalogService; writes media_catalog like a legacy page view; needs TMDB_API_KEY)
A quality-report --manifest manifest.json --legacy legacy-snapshot.json --out report/   # read-only: broadcasts, consolidation and quality per film
A enrich --manifest manifest.json --apply --invalidate  # withdraws the copy (identity and attestations untouched)
```

It changes only `metadata.*`, `originalTitle` (when empty) and bumps `version`; certification stays valid (tested). A film refused (`source_not_enriched`, `title_mismatch`, `year_mismatch`, `tmdb_type_mismatch` …) is left bare and listed; nothing is guessed. Re-running is idempotent; a changed catalogue row or a 30-day-old copy is a deterministic refresh.

## 5. Public canary (later, separate approval 6)

Phase 3D adds a **read-time legacy guard**: an allowlisted entity is served only while its legacy page would not be indexable (the film has no airing today or tomorrow in the read model); otherwise the request falls back to the legacy page exactly as if the canary were off (`legacy_indexable` in the admin stats). A read-model failure also falls back. So the canary can never replace an indexable page, and an entity page appears and disappears with the schedule; this is expected. SSR caches the legacy answer for up to 10 minutes fresh / 30 stale, so a page may return to the entity view a little after the guard allows it. Check `/v2/admin/entities/canary` `totals.legacy_indexable`.

```bash
A allowlist --manifest manifest.json --approved-by "<person>" --out /etc/guiatv/entity-canary.json     # all or nothing
I canary-check /etc/guiatv/entity-canary.json                                                          # exit 0
```

Set `CONTENT_ENTITY_PUBLIC_READ_ENABLED=true`, `CONTENT_ENTITY_PUBLIC_READ_SCOPE=canary`, `CONTENT_ENTITY_CANARY_FILE`, `CONTENT_ENTITY_CANARY_MAX=<N>`, `CONTENT_ENTITY_KILL_FILE=/etc/guiatv/ENTITY_KILL`, `CONTENT_OWNER_PUBLIC_KEY_FILE`; restart API **and SSR** (adding an entity needs the SSR restart); set the repository variable `ENTITY_EXPECTATION=canary` so the uptime probe stops flagging the entity read; then
`node apps/frontend/scripts/entity-canary-verify.mjs --origin https://guiaprogramaciontv.com --allowlist /etc/guiatv/entity-canary.json` (exit 0). Watch `GET /v2/admin/entities/canary` and run `canary-check` from cron.

## Rollback (any step)

| Situation | Action |
|---|---|
| Public canary misbehaves | `touch /etc/guiatv/ENTITY_KILL` (instant, no restart); then unset the flags, restart API and SSR, `entity-canary-verify.mjs --expect-off`, set `ENTITY_EXPECTATION` back to `off` |
| A single identity is wrong | `A revoke <entityId> --by "<person>" --reason "<why>"` (next read falls back to legacy) |
| Whole batch | `A revoke-batch --manifest manifest.json --by "<person>" --reason "<why>"`, then `A rollback-batch --manifest manifest.json` (dry run) and `--apply` (needs the write flags): removes the batch's entities, slugs and title keys; **the attestation and revocation records stay** as the audit trail |
| Back to the pre-canary state | unset every `CONTENT_*` flag, restart; the four collections stay (empty of entities); `A baseline --compare /root/canary-before.json --structural` shows only them and the retained attestation records |
| Release problem | `guiatv-ops.sh rollback` |

Rehearsal of all of the above, on the real batch, against scratch MongoDB: `A rehearse …` (refuses any database not named `guiatv_scratch_*`), report in `docs/seo/phase-3c/rehearsal-report.json`.
