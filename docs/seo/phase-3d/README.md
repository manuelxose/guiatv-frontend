# Phase 3D artefacts (2026-10-22)

| File | What |
|---|---|
| `legacy-payloads-20261022.json` | public API snapshot of the 20 canary films' legacy pages (2026-10-21T23:15Z); the only source of the fixtures besides the committed TMDB checks |
| `fixtures/` | `catalog.json` (media-catalogue rows), `airings.json` (read-model rows), `legacy-snapshot.json`; built by `node scripts/phase-3d-fixture.mjs`, no database, no network |
| `film-quality-report.json` / `.md` | per-film enrichment, broadcasts, legacy consolidation decision and publication quality, from the scratch rehearsal |
| `canary-manifest.json`, `canary-admit.jsonl`, `canary-legacy-probes.json` | the refreshed manifest (10 films) and its inputs; see `EVIDENCE-REFRESH.md` |
| `EVIDENCE-REFRESH.md` | what was refreshed, what could not be, and how to finish |

Regenerate the report (scratch MongoDB only; the CLI refuses any other database name):

```bash
MONGODB_URI=mongodb://127.0.0.1:27118 MONGODB_DB_NAME=guiatv_scratch_3d node apps/backend/dist/scripts/content-certify.js rehearse \
  --manifest docs/seo/phase-3c/canary-manifest.json --day <traces>:<verdicts> … --ledger docs/seo/phase-3b/ai-review/round2/ledger.jsonl \
  --sheet docs/seo/phase-3b/round2/review-sheet-3b-r2.csv --phase3d docs/seo/phase-3d/fixtures --phase3d-out docs/seo/phase-3d
```
(`<traces>:<verdicts>` pairs come from `docs/seo/phase-3b/round2/replay-inputs-r2.tar.gz`.) The report is the 3C manifest's 20 films, evaluated at the snapshot time. The test `ContentEnrichmentRehearsal.mongo.test` fails if the committed report is not what the code produces.
