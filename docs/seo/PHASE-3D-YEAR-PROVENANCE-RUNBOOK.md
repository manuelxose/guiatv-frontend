# EPG_YEAR_PROVENANCE: one-cycle activation runbook (reversible)

**Not enabled and not authorised.** This is the procedure the owner can approve later. Production flag state at the time of writing: unset.

## What the flag does

`SyncEPGData` overwrites a programme's `year` with the matched TMDB work's year, so the broadcaster's own year is lost and the stored year can no longer confirm the match. With `EPG_YEAR_PROVENANCE=true`, every enrichment that sets `year` also stores `sourceProvenance.yearProvenance = { rawXmltvYear, resolvedWorkYear, resolvedYearSource }` on the **programme document**. `year` keeps its meaning. Nothing reads the field except the identity gate (`rawYears`), which is off. It unblocks criterion 3 (`year_reliable`) of the quality criteria for later phases; it indexes nothing and changes no URL.

## Validation done (scratch data, 2026-10-22)

`SyncEPGData.year-provenance.mongo.test.ts` runs the real enrichment, `MongoProgramRepository`, and `TvReadModelBuilder` on a throwaway database, flag off then on, then off again, with three programmes (feed year ≠ TMDB year; equal; no feed year):

| Check | Result |
|---|---|
| public read model (`tv_read_airings`) with the flag on vs off | **identical** (deep equal, `_id`/timestamps excluded); the feed year never appears in it |
| programme `year` | unchanged by the flag (`1989`, `1995`, `1976`) |
| stored provenance | only with the flag on: `{rawXmltvYear: '2016', resolvedWorkYear: '1989', resolvedYearSource}`, `rawXmltvYear: null` when the feed had none |
| everything else on the stored programme | identical to flag-off documents |
| switching back off and re-enriching | flag-off documents again, read model identical |

## One-cycle procedure (needs the owner's written approval; no migration, no schema change)

Preconditions: the post-boot check and uptime probe green; a release that includes `EPG_YEAR_PROVENANCE` support (deployed since PR #41); a quiet window outside the EPG sync times.

1. Record the baseline (read-only): `content-certify baseline --out before.json` and the public read-model digest of one finished day (e.g. `GET /v2/tv/read?view=now&date=<day>` saved, hash it).
2. Set `EPG_YEAR_PROVENANCE=true` in `/etc/guiatv/api.env` (only that line) and restart **API only** (`guiatv-ops.sh restart` verifies health). Do not restart SSR.
3. Let **one** EPG sync cycle run (or run `npm run job:syncEPG` once). Programmes written from then on carry the field.
4. Verify, read-only: (a) `GET /v2/tv/read?...` for the same day: same digest as step 1 for programmes unchanged by the sync; (b) a bounded count of programme documents with `sourceProvenance.yearProvenance` is > 0 and ≤ the day's TMDB-enriched programmes; (c) `content-certify baseline --compare before.json --structural` shows no collection or index change; (d) API 5xx rate and `/healthz` unchanged.
5. Stop condition for any surprise: go to Rollback. Success is only "the field exists and nothing public moved".

## Rollback (reversible at every step)

1. Remove the line (or set `EPG_YEAR_PROVENANCE=false`) and restart the API. New programmes stop carrying the field.
2. Existing `yearProvenance` keys are inert (nothing public reads them) (not verified here whether a later flag-off sync drops them from a rewritten programme; use the cleanup if they must go). Optional immediate cleanup, owner-approved, bounded: `db.programs.updateMany({ 'sourceProvenance.yearProvenance': { $exists: true } }, { $unset: { 'sourceProvenance.yearProvenance': '' } })` on the connected database only.
3. Confirm with the step-4 checks.

## What this does **not** do

It does not make any identity independent evidence, does not verify a person, does not enable entity reads or writes, and does not change any indexable URL. Criterion 3 needs the field to be populated for the film *and* agree with the catalogue before `year_reliable` can pass; that evaluation belongs to a later phase.
